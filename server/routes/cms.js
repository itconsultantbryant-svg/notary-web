"use strict";

const express = require("express");
const { getDb } = require("../db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// Public: get page content for CMS loader
router.get("/content/:slug", async (req, res) => {
  try {
    const db = await getDb();
    const slug = req.params.slug;
    const page = await db.get("SELECT slug, title, meta_description, updated_at FROM cms_pages WHERE slug = ?", [slug]);
    const blocks = await db.all(
      "SELECT block_key, content_type, content, label FROM cms_blocks WHERE page_slug = ? ORDER BY block_key",
      [slug]
    );
    res.json({ page: page || null, blocks: blocks || [] });
  } catch (err) {
    console.error("CMS content error:", err);
    res.status(500).json({ error: "Failed to load content" });
  }
});

// Public: list all pages (minimal)
router.get("/pages", async (req, res) => {
  try {
    const db = await getDb();
    const pages = await db.all("SELECT slug, title, meta_description, updated_at FROM cms_pages ORDER BY title");
    res.json({ pages });
  } catch (err) {
    res.status(500).json({ error: "Failed to load pages" });
  }
});

// Admin: full page with blocks
router.get("/admin/pages/:slug", authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const page = await db.get("SELECT * FROM cms_pages WHERE slug = ?", [req.params.slug]);
    if (!page) return res.status(404).json({ error: "Page not found" });
    const blocks = await db.all("SELECT * FROM cms_blocks WHERE page_slug = ? ORDER BY block_key", [req.params.slug]);
    res.json({ page, blocks });
  } catch (err) {
    res.status(500).json({ error: "Failed to load page" });
  }
});

// Admin: list pages
router.get("/admin/pages", authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const pages = await db.all(`
      SELECT p.slug, p.title, p.meta_description, p.updated_at,
        (SELECT COUNT(*) FROM cms_blocks b WHERE b.page_slug = p.slug) AS block_count
      FROM cms_pages p ORDER BY p.title
    `);
    res.json({ pages });
  } catch (err) {
    res.status(500).json({ error: "Failed to load pages" });
  }
});

// Admin: update page meta
router.put("/admin/pages/:slug", authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { title, meta_description } = req.body;
    const existing = await db.get("SELECT slug FROM cms_pages WHERE slug = ?", [req.params.slug]);
    if (!existing) return res.status(404).json({ error: "Page not found" });

    await db.run(
      "UPDATE cms_pages SET title = ?, meta_description = ?, updated_at = ? WHERE slug = ?",
      [title, meta_description, new Date().toISOString(), req.params.slug]
    );

    const page = await db.get("SELECT * FROM cms_pages WHERE slug = ?", [req.params.slug]);
    res.json({ page });
  } catch (err) {
    res.status(500).json({ error: "Failed to update page" });
  }
});

// Admin: update or create block
router.put("/admin/blocks/:slug/:blockKey", authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { slug, blockKey } = req.params;
    const { content, content_type, label } = req.body;

    const page = await db.get("SELECT slug FROM cms_pages WHERE slug = ?", [slug]);
    if (!page) return res.status(404).json({ error: "Page not found" });

    const existing = await db.get(
      "SELECT id FROM cms_blocks WHERE page_slug = ? AND block_key = ?",
      [slug, blockKey]
    );

    if (existing) {
      await db.run(
        "UPDATE cms_blocks SET content = ?, content_type = ?, label = ? WHERE page_slug = ? AND block_key = ?",
        [content, content_type || "text", label, slug, blockKey]
      );
    } else {
      await db.run(
        "INSERT INTO cms_blocks (page_slug, block_key, content, content_type, label) VALUES (?, ?, ?, ?, ?)",
        [slug, blockKey, content, content_type || "text", label || blockKey]
      );
    }

    await db.run("UPDATE cms_pages SET updated_at = ? WHERE slug = ?", [new Date().toISOString(), slug]);

    const block = await db.get(
      "SELECT * FROM cms_blocks WHERE page_slug = ? AND block_key = ?",
      [slug, blockKey]
    );
    res.json({ block });
  } catch (err) {
    console.error("Update block error:", err);
    res.status(500).json({ error: "Failed to update block" });
  }
});

// Admin: delete block
router.delete("/admin/blocks/:slug/:blockKey", authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    await db.run(
      "DELETE FROM cms_blocks WHERE page_slug = ? AND block_key = ?",
      [req.params.slug, req.params.blockKey]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete block" });
  }
});

// Admin: create new page
router.post("/admin/pages", authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const { slug, title, meta_description } = req.body;
    if (!slug || !title) return res.status(400).json({ error: "Slug and title required" });

    const exists = await db.get("SELECT slug FROM cms_pages WHERE slug = ?", [slug]);
    if (exists) return res.status(409).json({ error: "Page already exists" });

    await db.run(
      "INSERT INTO cms_pages (slug, title, meta_description) VALUES (?, ?, ?)",
      [slug, title, meta_description || ""]
    );

    const page = await db.get("SELECT * FROM cms_pages WHERE slug = ?", [slug]);
    res.status(201).json({ page });
  } catch (err) {
    res.status(500).json({ error: "Failed to create page" });
  }
});

module.exports = router;
