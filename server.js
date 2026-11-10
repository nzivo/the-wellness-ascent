/* ==========================================================
   The Wellness Ascent — local / self-hosted server
   Zero dependencies: requires only Node.js 18+.
   (On Vercel this file is not used — see api/ and vercel.json.)

   Run:   node server.js
   Env:   PORT=3000
          DATA_KEY=<64 hex chars>   AES-256-GCM key for data at rest (strongly recommended)
          ADMIN_TOKEN=<long random> enables the read-only admin API
          SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY  optional: store in Supabase instead of ./data
          TRUST_PROXY=1             when running behind a reverse proxy / load balancer
          NODE_ENV=production       enables HSTS
   ========================================================== */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const core = require("./lib/core");
const storage = require("./lib/storage");
const { submit, admin, ROUTES } = require("./lib/handlers");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const PROD = process.env.NODE_ENV === "production";

const problems = core.configProblems();
if (problems.length) { problems.forEach((p) => console.error(p)); process.exit(1); }
if (!core.DATA_KEY) console.warn("⚠  DATA_KEY not set — submissions will be stored UNENCRYPTED. Set DATA_KEY before going live.");
console.log(`Storage: ${storage.backendName()}`);

function secHeaders(res) {
  res.setHeader("Content-Security-Policy", core.CSP);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  if (PROD) res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".webp": "image/webp", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
};
const send = (res, code, text) => { res.statusCode = code; res.setHeader("Content-Type", "text/plain; charset=utf-8"); res.end(text); };

function notFound(res) {
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  fs.createReadStream(path.join(PUBLIC_DIR, "404.html")).on("error", () => res.end("Not found")).pipe(res);
}

function serveStatic(req, res, urlPath) {
  let rel;
  try { rel = decodeURIComponent(urlPath); } catch { return send(res, 400, "Bad request"); }
  if (rel.endsWith("/")) rel += "index.html";
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  // Block path traversal and hidden files
  if (!file.startsWith(PUBLIC_DIR + path.sep) || rel.split("/").some((p) => p.startsWith("."))) return notFound(res);
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      if (!path.extname(file)) return serveStatic(req, res, urlPath + ".html"); // /about -> /about.html
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

const submitHandlers = Object.fromEntries(Object.keys(ROUTES).map((c) => [c, submit(c)]));

const server = http.createServer((req, res) => {
  secHeaders(res);
  let pathname;
  try { pathname = new URL(req.url, "http://localhost").pathname; } catch { return send(res, 400, "Bad request"); }

  if (pathname.startsWith("/api/")) {
    const m = pathname.match(/^\/api\/(appointments|contact|testimonials)$/);
    if (m) return submitHandlers[m[1]](req, res);
    const a = pathname.match(/^\/api\/admin\/([a-z]+)$/);
    if (a) return admin(req, res, a[1]);
    return core.json(res, 404, { error: "Not found" });
  }
  if (req.method !== "GET" && req.method !== "HEAD") { res.setHeader("Allow", "GET, HEAD"); return send(res, 405, "Method not allowed"); }
  serveStatic(req, res, pathname);
});
server.headersTimeout = 15_000;
server.requestTimeout = 20_000;
server.listen(PORT, () => console.log(`The Wellness Ascent running at http://localhost:${PORT}`));
