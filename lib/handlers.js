/* API request handlers shared by the local server and the Vercel functions. */
"use strict";
const core = require("./core");
const storage = require("./storage");

const ROUTES = {
  appointments: { validate: core.validateAppointment, limit: 5 },
  contact: { validate: core.validateContact, limit: 5 },
  testimonials: { validate: core.validateTestimonial, limit: 3 },
};
const WINDOW = 15 * 60_000;

/* POST /api/{appointments|contact|testimonials} */
function submit(collection) {
  const route = ROUTES[collection];
  return async function handler(req, res) {
    try {
      const ip = core.clientIp(req);
      if (req.method !== "POST") { res.setHeader("Allow", "POST"); return core.json(res, 405, { error: "Method not allowed" }); }
      if (!core.sameOrigin(req)) return core.json(res, 403, { error: "Forbidden" });
      if (core.rateLimited(collection + ":" + ip, route.limit, WINDOW)) return core.json(res, 429, { error: "Too many requests. Please try again later or contact us by phone." });
      if (!storage.isConfigured()) {
        console.error("Storage is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
        return core.json(res, 503, { error: "We could not save your request right now. Please contact us by phone, WhatsApp or email." });
      }

      let body;
      try { body = await core.readJson(req); } catch (err) { return core.json(res, err.code || 400, { error: err.message }); }

      // Honeypot: bots fill hidden fields. Pretend success, store nothing.
      if (body.website) return core.json(res, 200, { ok: true, reference: "OK" });

      const { e, d } = route.validate(body);
      if (e.length) return core.json(res, 422, { error: "Please check the highlighted fields and try again.", fields: [...new Set(e)] });

      const reference = await storage.store(collection, d);
      console.log(`new ${collection} ${reference}`); // no personal data in logs
      // TODO: send notification email to the practice and confirmation to the client (e.g. via Resend)
      return core.json(res, 201, { ok: true, reference });
    } catch (err) {
      console.error(`${collection} failed:`, err.message);
      return core.json(res, 500, { error: "Something went wrong. Please try again." });
    }
  };
}

/* GET /api/admin/{appointments|contact|testimonials}  (Authorization: Bearer ADMIN_TOKEN) */
async function admin(req, res, collection) {
  try {
    if (!core.ADMIN_TOKEN || !ROUTES[collection]) return core.json(res, 404, { error: "Not found" });
    const ip = core.clientIp(req);
    if (core.rateLimited("admin:" + ip, 30, WINDOW)) return core.json(res, 429, { error: "Too many requests" });
    if (req.method !== "GET" || !core.tokenMatches(req)) {
      await storage.audit("admin_auth_failed", ip);
      return core.json(res, 401, { error: "Unauthorized" });
    }
    await storage.audit("admin_read:" + collection, ip);
    const items = await storage.list(collection);
    return core.json(res, 200, { count: items.length, items });
  } catch (err) {
    console.error("admin failed:", err.message);
    return core.json(res, 500, { error: "Server error" });
  }
}

module.exports = { submit, admin, ROUTES };
