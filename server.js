/* ==========================================================
   The Wellness Ascent — secure web server & API
   Zero dependencies: requires only Node.js 18+.

   Run:   node server.js
   Env:   PORT=3000
          DATA_KEY=<64 hex chars>   AES-256-GCM key for data at rest (strongly recommended)
          ADMIN_TOKEN=<long random> enables the read-only admin API
          TRUST_PROXY=1             when running behind a reverse proxy / load balancer
          NODE_ENV=production       enables HSTS
   ========================================================== */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const PROD = process.env.NODE_ENV === "production";
const TRUST_PROXY = process.env.TRUST_PROXY === "1";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const DATA_KEY = process.env.DATA_KEY ? Buffer.from(process.env.DATA_KEY, "hex") : null;

if (DATA_KEY && DATA_KEY.length !== 32) {
  console.error("DATA_KEY must be 64 hex characters (32 bytes). Generate one with:\n  node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
  process.exit(1);
}
if (!DATA_KEY) console.warn("⚠  DATA_KEY not set — submissions will be stored UNENCRYPTED. Set DATA_KEY before going live.");
if (ADMIN_TOKEN && ADMIN_TOKEN.length < 32) { console.error("ADMIN_TOKEN must be at least 32 characters."); process.exit(1); }

fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });

/* ---------------- Security headers ---------------- */
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

function secHeaders(res) {
  res.setHeader("Content-Security-Policy", CSP);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  if (PROD) res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
}

/* ---------------- Static files ---------------- */
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
};

function serveStatic(req, res, urlPath) {
  let rel;
  try { rel = decodeURIComponent(urlPath); } catch { return send(res, 400, "Bad request"); }
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  // Block path traversal and hidden files
  if (!file.startsWith(PUBLIC_DIR + path.sep) || rel.split("/").some((p) => p.startsWith("."))) return send(res, 404, "Not found");
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      // Pretty URLs: /about -> /about.html
      if (!path.extname(file)) return serveStatic(req, res, urlPath + ".html");
      return notFound(res);
    }
    const ext = path.extname(file).toLowerCase();
    res.statusCode = 200;
    res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
    res.setHeader("Cache-Control", ext === ".html" ? "no-cache" : "public, max-age=604800");
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  });
}
function notFound(res) {
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<!doctype html><meta charset="utf-8"><title>Page not found</title><link rel="stylesheet" href="/assets/css/styles.css"><main class="section center"><div class="container"><h1>Page not found</h1><p class="lead mx-auto">The page you are looking for has moved or does not exist.</p><a class="btn btn-gold" href="/">Back to home</a></div></main>`);
}
function send(res, code, text) { res.statusCode = code; res.setHeader("Content-Type", "text/plain; charset=utf-8"); res.end(text); }
function json(res, code, obj) { res.statusCode = code; res.setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); res.end(JSON.stringify(obj)); }

/* ---------------- Rate limiting (in-memory) ---------------- */
const buckets = new Map();
function rateLimited(key, limit, windowMs) {
  const now = Date.now();
  const b = buckets.get(key) || { n: 0, reset: now + windowMs };
  if (now > b.reset) { b.n = 0; b.reset = now + windowMs; }
  b.n++;
  buckets.set(key, b);
  return b.n > limit;
}
setInterval(() => { const now = Date.now(); for (const [k, b] of buckets) if (now > b.reset) buckets.delete(k); }, 60_000).unref();

function clientIp(req) {
  if (TRUST_PROXY && req.headers["x-forwarded-for"]) return String(req.headers["x-forwarded-for"]).split(",")[0].trim();
  return req.socket.remoteAddress || "unknown";
}

/* ---------------- Body parsing ---------------- */
function readJson(req, max = 16 * 1024) {
  return new Promise((resolve, reject) => {
    if (!String(req.headers["content-type"] || "").startsWith("application/json")) return reject(Object.assign(new Error("Unsupported content type"), { code: 415 }));
    let size = 0; const chunks = [];
    req.on("data", (c) => { size += c.length; if (size > max) { reject(Object.assign(new Error("Payload too large"), { code: 413 })); req.destroy(); } else chunks.push(c); });
    req.on("end", () => { try { const o = JSON.parse(Buffer.concat(chunks).toString("utf8")); if (!o || typeof o !== "object" || Array.isArray(o)) throw 0; resolve(o); } catch { reject(Object.assign(new Error("Invalid JSON"), { code: 400 })); } });
    req.on("error", reject);
  });
}

/* CSRF defence: browsers always send Origin on cross-site POSTs. */
function sameOrigin(req) {
  const origin = req.headers.origin || req.headers.referer;
  if (!origin) return false;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
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

/* ---------------- Encrypted storage ---------------- */
function encrypt(obj) {
  const plain = Buffer.from(JSON.stringify(obj), "utf8");
  if (!DATA_KEY) return { plain: obj };
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", DATA_KEY, iv);
  const enc = Buffer.concat([c.update(plain), c.final()]);
  return { enc: Buffer.concat([iv, c.getAuthTag(), enc]).toString("base64") };
}
function decrypt(rec) {
  if (rec.plain) return rec.plain;
  if (!DATA_KEY) return { error: "encrypted — DATA_KEY required" };
  const buf = Buffer.from(rec.enc, "base64");
  const d = crypto.createDecipheriv("aes-256-gcm", DATA_KEY, buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return JSON.parse(Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8"));
}
const PREFIX = { appointments: "TWA", contact: "MSG", testimonials: "TST" };
function store(collection, data) {
  const ref = `${PREFIX[collection]}-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  const rec = { id: crypto.randomUUID(), reference: ref, createdAt: new Date().toISOString(), status: "pending", ...encrypt(data) };
  fs.appendFileSync(path.join(DATA_DIR, collection + ".jsonl"), JSON.stringify(rec) + "\n", { mode: 0o600 });
  return ref;
}
function audit(event, req) {
  fs.appendFileSync(path.join(DATA_DIR, "audit.log"), JSON.stringify({ at: new Date().toISOString(), event, ip: clientIp(req) }) + "\n", { mode: 0o600 });
}

/* ---------------- API ---------------- */
const ROUTES = {
  "/api/appointments": { collection: "appointments", validate: validateAppointment, limit: 5 },
  "/api/contact": { collection: "contact", validate: validateContact, limit: 5 },
  "/api/testimonials": { collection: "testimonials", validate: validateTestimonial, limit: 3 },
};

async function handleApi(req, res, pathname) {
  const ip = clientIp(req);

  // Read-only admin API (temporary until the admin dashboard is built)
  const adm = pathname.match(/^\/api\/admin\/(appointments|contact|testimonials)$/);
  if (adm) {
    if (!ADMIN_TOKEN) return json(res, 404, { error: "Not found" });
    if (rateLimited("admin:" + ip, 30, 15 * 60_000)) return json(res, 429, { error: "Too many requests" });
    const given = Buffer.from(String(req.headers.authorization || "").replace(/^Bearer\s+/i, ""));
    const want = Buffer.from(ADMIN_TOKEN);
    if (req.method !== "GET" || given.length !== want.length || !crypto.timingSafeEqual(given, want)) {
      audit("admin_auth_failed", req);
      return json(res, 401, { error: "Unauthorized" });
    }
    audit("admin_read:" + adm[1], req);
    const file = path.join(DATA_DIR, adm[1] + ".jsonl");
    const rows = fs.existsSync(file) ? fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => { const r = JSON.parse(l); return { id: r.id, reference: r.reference, createdAt: r.createdAt, status: r.status, data: decrypt(r) }; }) : [];
    return json(res, 200, { count: rows.length, items: rows.reverse() });
  }

  const route = ROUTES[pathname];
  if (!route) return json(res, 404, { error: "Not found" });
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return json(res, 405, { error: "Method not allowed" }); }
  if (!sameOrigin(req)) return json(res, 403, { error: "Forbidden" });
  if (rateLimited(pathname + ":" + ip, route.limit, 15 * 60_000)) return json(res, 429, { error: "Too many requests. Please try again later or contact us by phone." });

  let body;
  try { body = await readJson(req); } catch (err) { return json(res, err.code || 400, { error: err.message }); }

  // Honeypot: bots fill hidden fields. Pretend success, store nothing.
  if (body.website) return json(res, 200, { ok: true, reference: "OK" });

  const { e, d } = route.validate(body);
  if (e.length) return json(res, 422, { error: "Please check the highlighted fields and try again.", fields: [...new Set(e)] });

  try {
    const reference = store(route.collection, d);
    console.log(`[${new Date().toISOString()}] new ${route.collection} ${reference}`); // no personal data in logs
    // TODO: send notification email to the practice and confirmation to the client (e.g. via Resend)
    return json(res, 201, { ok: true, reference });
  } catch (err) {
    console.error("store failed:", err.message);
    return json(res, 500, { error: "Something went wrong. Please try again." });
  }
}

/* ---------------- Server ---------------- */
const server = http.createServer((req, res) => {
  secHeaders(res);
  let pathname;
  try { pathname = new URL(req.url, "http://localhost").pathname; } catch { return send(res, 400, "Bad request"); }
  if (pathname.startsWith("/api/")) return handleApi(req, res, pathname).catch((err) => { console.error(err); json(res, 500, { error: "Server error" }); });
  if (req.method !== "GET" && req.method !== "HEAD") { res.setHeader("Allow", "GET, HEAD"); return send(res, 405, "Method not allowed"); }
  serveStatic(req, res, pathname);
});
server.headersTimeout = 15_000;
server.requestTimeout = 20_000;
server.listen(PORT, () => console.log(`The Wellness Ascent running at http://localhost:${PORT}`));
