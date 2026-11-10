// Vercel function: GET /api/admin/{appointments|contact|testimonials}
const { admin } = require("../../lib/handlers");
module.exports = (req, res) => admin(req, res, String((req.query && req.query.collection) || ""));
