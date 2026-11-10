/* Storage adapter.
   - Supabase Postgres (via its REST API) when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set.
     Required on Vercel, whose filesystem is not persistent.
   - Local JSON-lines files in ./data otherwise (for `node server.js`).
   Records are encrypted with DATA_KEY before they leave this process. */
"use strict";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { ON_VERCEL, encrypt, decrypt } = require("./core");

const SB_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const USE_SUPABASE = !!(SB_URL && SB_KEY);
const DATA_DIR = path.join(__dirname, "..", "data");
const TABLE = "submissions";

const PREFIX = { appointments: "TWA", contact: "MSG", testimonials: "TST", audit: "AUD" };

function isConfigured() { return USE_SUPABASE || !ON_VERCEL; }
function backendName() { return USE_SUPABASE ? "supabase" : ON_VERCEL ? "none" : "file"; }

function newRecord(collection, data, encryptIt = true) {
  const ref = `${PREFIX[collection]}-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  return {
    id: crypto.randomUUID(), reference: ref, collection,
    created_at: new Date().toISOString(), status: collection === "audit" ? "logged" : "pending",
    payload: encryptIt ? encrypt(data) : { plain: data },
  };
}

async function sb(method, query, body) {
  const res = await fetch(`${SB_URL}/rest/v1/${TABLE}${query || ""}`, {
    method,
    headers: {
      apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json",
      Prefer: method === "POST" ? "return=minimal" : "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Supabase ${method} failed: ${res.status} ${await res.text().catch(() => "")}`.slice(0, 300));
  return method === "GET" ? res.json() : null;
}

async function insert(rec) {
  if (USE_SUPABASE) return sb("POST", "", rec);
  if (ON_VERCEL) throw new Error("Storage not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  fs.appendFileSync(path.join(DATA_DIR, rec.collection + ".jsonl"), JSON.stringify(rec) + "\n", { mode: 0o600 });
}

async function store(collection, data) {
  const rec = newRecord(collection, data);
  await insert(rec);
  return rec.reference;
}

/* Audit entries contain no personal data (event + IP), so they are stored unencrypted. */
async function audit(event, ip) {
  try { await insert(newRecord("audit", { event, ip }, false)); } catch (e) { console.error("audit failed:", e.message); }
}

async function list(collection) {
  let rows;
  if (USE_SUPABASE) {
    rows = await sb("GET", `?collection=eq.${encodeURIComponent(collection)}&order=created_at.desc&limit=500`);
  } else {
    const file = path.join(DATA_DIR, collection + ".jsonl");
    rows = fs.existsSync(file) ? fs.readFileSync(file, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).reverse() : [];
  }
  return rows.map((r) => ({ id: r.id, reference: r.reference, createdAt: r.created_at, status: r.status, data: decrypt(r.payload) }));
}

module.exports = { store, audit, list, isConfigured, backendName };
