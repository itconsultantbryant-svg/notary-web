"use strict";

require("dotenv").config();

const { initializeDatabase } = require("../server/init");

module.exports = async (req, res) => {
  const secret = req.query.secret || req.headers["x-setup-secret"];
  const expected = process.env.SETUP_SECRET || process.env.JWT_SECRET;

  if (!expected || secret !== expected) {
    return res.status(403).json({ error: "Forbidden — provide ?secret= matching SETUP_SECRET or JWT_SECRET" });
  }

  try {
    const result = await initializeDatabase();
    res.json({
      ok: true,
      message: "Database initialized",
      admin: result.admin.created ? { email: result.admin.email, note: "Default password from ADMIN_PASSWORD env" } : { email: result.admin.email, note: "Already exists" },
      documentsCreated: result.documentsCreated
    });
  } catch (err) {
    console.error("Setup failed:", err);
    res.status(500).json({ error: err.message || "Setup failed" });
  }
};
