/* Shared core: config, security helpers, validation, encryption.
   Used by both the local server (server.js) and the Vercel functions (api/). */
"use strict";
const crypto = require("crypto");

const ON_VERCEL = !!process.env.VERCEL;
const TRUST_PROXY = ON_VERCEL || process.env.TRUST_PROXY === "1";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const DATA_KEY = process.env.DATA_KEY ? Buffer.from(process.env.DATA_KEY, "hex") : null;

function configProblems() {
  const p = [];
  if (DATA_KEY && DATA_KEY.length !== 32) p.push("DATA_KEY must be 64 hex characters (32 bytes).");
  if (ADMIN_TOKEN && ADMIN_TOKEN.length < 32) p.push("ADMIN_TOKEN must be at least 32 characters.");
  return p;
}

/* ---------------- Security headers (local server; Vercel uses vercel.json) ---------------- */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: https://images.unsplash.com",
  "frame-src https://www.google.com",
  "connect-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join("; ");

/* ---------------- Rate limiting ----------------
   In-memory. On Vercel each function instance has its own memory, so this is a
   best-effort limit; add Vercel Firewall rate-limit rules for a hard limit. */
const buckets = new Map();
function rateLimited(key, limit, windowMs) {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, b] of buckets) if (now > b.reset) buckets.delete(k);
  const b = buckets.get(key) || { n: 0, reset: now + windowMs };
  if (now > b.reset) { b.n = 0; b.reset = now + windowMs; }
  b.n++;
  buckets.set(key, b);
  return b.n > limit;
}

function clientIp(req) {
  if (TRUST_PROXY && req.headers["x-forwarded-for"]) return String(req.headers["x-forwarded-for"]).split(",")[0].trim();
  return (req.socket && req.socket.remoteAddress) || "unknown";
}

/* CSRF defence: browsers always send Origin on cross-site POSTs. */
function sameOrigin(req) {
  const origin = req.headers.origin || req.headers.referer;
  if (!origin) return false;
  const host = req.headers["x-forwarded-host"] && TRUST_PROXY ? req.headers["x-forwarded-host"] : req.headers.host;
  try { return new URL(origin).host === host; } catch { return false; }
}

function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(obj));
}

/* Reads a JSON body. On Vercel, req.body is already parsed; locally we read the stream. */
function readJson(req, max = 16 * 1024) {
  const err = (code, msg) => Object.assign(new Error(msg), { code });
  if (!String(req.headers["content-type"] || "").startsWith("application/json")) return Promise.reject(err(415, "Unsupported content type"));
  if (Number(req.headers["content-length"] || 0) > max) return Promise.reject(err(413, "Payload too large"));
  const check = (o) => { if (!o || typeof o !== "object" || Array.isArray(o)) throw err(400, "Invalid JSON"); return o; };
  if (ON_VERCEL) {
    try { return Promise.resolve(check(typeof req.body === "string" ? JSON.parse(req.body) : req.body)); }
    catch (e) { return Promise.reject(e.code ? e : err(400, "Invalid JSON")); }
  }
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on("data", (c) => { size += c.length; if (size > max) { reject(err(413, "Payload too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => { try { resolve(check(JSON.parse(Buffer.concat(chunks).toString("utf8")))); } catch { reject(err(400, "Invalid JSON")); } });
    req.on("error", reject);
  });
}

/* ---------------- Validation ---------------- */
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;
const PHONE = /^[+\d][\d\s()-]{6,24}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const clean = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max) : "");
const oneOf = (v, list) => (list.includes(v) ? v : null);

function validateAppointment(b) {
  const e = [];
  const d = {
    country: oneOf(b.country, ["kenya", "seychelles"]),
    service: oneOf(b.service, ["therapy", "psychiatry", "nutrition"]),
    format: oneOf(b.format, ["individual", "couples", "family", "adolescent"]) || "individual",
    type: oneOf(b.type, ["physical", "virtual"]),
    date: clean(b.date, 10), altDate: clean(b.altDate, 10), time: clean(b.time, 5),
    firstName: clean(b.firstName, 60), lastName: clean(b.lastName, 60),
    email: clean(b.email, 150), phone: clean(b.phone, 30),
    sessionLanguage: oneOf(b.sessionLanguage, ["en", "fr"]) || "en",
    firstVisit: oneOf(b.firstVisit, ["yes", "no"]) || "yes",
    notes: clean(b.notes, 1000), language: oneOf(b.language, ["en", "fr"]) || "en",
  };
  if (!d.country) e.push("country");
  if (!d.service) e.push("service");
  if (!d.type) e.push("type");
  if (d.country === "seychelles" && d.type === "physical") e.push("type");
  const today = new Date().toISOString().slice(0, 10);
  const max = new Date(Date.now() + 120 * 864e5).toISOString().slice(0, 10);
  if (!DATE.test(d.date) || d.date <= today || d.date > max || new Date(d.date + "T12:00:00Z").getUTCDay() === 0) e.push("date");
  if (d.altDate && (!DATE.test(d.altDate) || d.altDate <= today || d.altDate > max)) e.push("altDate");
  if (!TIME.test(d.time)) e.push("time");
  if (!d.firstName) e.push("firstName");
  if (!d.lastName) e.push("lastName");
  if (!EMAIL.test(d.email)) e.push("email");
  if (!PHONE.test(d.phone)) e.push("phone");
  if (b.consent !== "yes") e.push("consent");
  return { e, d };
}
function validateContact(b) {
  const e = [];
  const d = {
    name: clean(b.name, 100), email: clean(b.email, 150), phone: clean(b.phone, 30),
    country: oneOf(b.country, ["kenya", "seychelles", "other"]) || "other",
    subject: oneOf(b.subject, ["general", "services", "booking", "fees", "corporate", "media"]),
    message: clean(b.message, 2000), language: oneOf(b.language, ["en", "fr"]) || "en",
  };
  if (!d.name) e.push("name");
  if (!EMAIL.test(d.email)) e.push("email");
  if (d.phone && !PHONE.test(d.phone)) e.push("phone");
  if (!d.subject) e.push("subject");
  if (d.message.length < 2) e.push("message");
  if (b.consent !== "yes") e.push("consent");
  return { e, d };
}
function validateTestimonial(b) {
  const e = [];
  const d = {
    initials: clean(b.initials, 8), service: oneOf(b.service, ["therapy", "psychiatry", "nutrition"]),
    country: oneOf(b.country, ["kenya", "seychelles"]) || "kenya",
    rating: Math.min(5, Math.max(1, parseInt(b.rating, 10) || 5)),
    message: clean(b.message, 1000), language: oneOf(b.language, ["en", "fr"]) || "en",
  };
  if (!d.initials) e.push("initials");
  if (!d.service) e.push("service");
  if (d.message.length < 2) e.push("message");
  if (b.consent !== "yes") e.push("consent");
  return { e, d };
}

/* ---------------- Encryption at rest (AES-256-GCM) ---------------- */
function encrypt(obj) {
  if (!DATA_KEY) return { plain: obj };
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", DATA_KEY, iv);
  const enc = Buffer.concat([c.update(Buffer.from(JSON.stringify(obj), "utf8")), c.final()]);
  return { enc: Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64") };
}
function decrypt(payload) {
  if (payload.plain) return payload.plain;
  if (!DATA_KEY) return { error: "encrypted — DATA_KEY required" };
  const buf = Buffer.from(payload.enc, "base64");
  const d = crypto.createDecipheriv("aes-256-gcm", DATA_KEY, buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return JSON.parse(Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8"));
}

function tokenMatches(req) {
  if (!ADMIN_TOKEN) return false;
  const given = Buffer.from(String(req.headers.authorization || "").replace(/^Bearer\s+/i, ""));
  const want = Buffer.from(ADMIN_TOKEN);
  return given.length === want.length && crypto.timingSafeEqual(given, want);
}

module.exports = {
  ON_VERCEL, ADMIN_TOKEN, DATA_KEY, CSP, configProblems,
  rateLimited, clientIp, sameOrigin, json, readJson, tokenMatches,
  validateAppointment, validateContact, validateTestimonial, encrypt, decrypt,
};
