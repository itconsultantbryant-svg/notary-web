"use strict";

const express = require("express");
const { getDb } = require("../db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// Public contact / request forms
router.post("/", async (req, res) => {
  try {
    const db = await getDb();
    const body = req.body;

    const name = body.name || body.full_name || "";
    const email = body.email || "";
    const phone = body.phone || "";
    const subject = body.subject || body.service_type || "General inquiry";
    const message = body.message || body.notes || "";
    const formType = body.form_type || (body.service_type ? "request" : "contact");

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const extra = { ...body };
    delete extra.name;
    delete extra.full_name;
    delete extra.email;
    delete extra.phone;
    delete extra.subject;
    delete extra.message;
    delete extra.notes;
    delete extra.form_type;

    await db.run(
      `INSERT INTO contact_submissions (name, email, phone, subject, message, form_type, extra_data)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone, subject, message, formType, JSON.stringify(extra)]
    );

    res.json({
      ok: true,
      message: "Thank you. Your request has been received — our office will contact you shortly."
    });
  } catch (err) {
    console.error("Contact form error:", err);
    res.status(500).json({ error: "Failed to submit form" });
  }
});

// Admin: list submissions
router.get("/", authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const submissions = await db.all("SELECT * FROM contact_submissions ORDER BY created_at DESC LIMIT 200");
    res.json({ submissions });
  } catch (err) {
    res.status(500).json({ error: "Failed to load submissions" });
  }
});

// Admin: delete submission
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    await db.run("DELETE FROM contact_submissions WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

// Admin dashboard stats
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const docs = await db.get("SELECT COUNT(*) AS count FROM documents");
    const active = await db.get("SELECT COUNT(*) AS count FROM documents WHERE status = 'active'");
    const pages = await db.get("SELECT COUNT(*) AS count FROM cms_pages");
    const blocks = await db.get("SELECT COUNT(*) AS count FROM cms_blocks");
    const contacts = await db.get("SELECT COUNT(*) AS count FROM contact_submissions");
    const recent = await db.get(
      "SELECT COUNT(*) AS count FROM contact_submissions WHERE created_at >= datetime('now', '-7 days')"
    );

    res.json({
      documents: docs.count,
      activeDocuments: active.count,
      cmsPages: pages.count,
      cmsBlocks: blocks.count,
      contactSubmissions: contacts.count,
      recentSubmissions: recent.count
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load stats" });
  }
});

module.exports = router;
