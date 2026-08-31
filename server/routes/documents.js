"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

function getUploadsDir() {
  const dir = process.env.VERCEL
    ? path.join("/tmp", "uploads", "documents")
    : path.join(__dirname, "..", "..", "uploads", "documents");
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    console.warn("Upload dir init:", e.message);
  }
  return dir;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, getUploadsDir()),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(pdf|jpg|jpeg|png|doc|docx)$/i;
    if (allowed.test(file.originalname)) cb(null, true);
    else cb(new Error("Only PDF, JPG, PNG, DOC files allowed"));
  }
});

function generateDocumentId() {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `JTNP-${year}-${rand}`;
}

// Public verification
router.get("/verify/:documentId", async (req, res) => {
  try {
    const documentId = req.params.documentId.trim().toUpperCase();
    const db = await getDb();
    const doc = await db.get(
      "SELECT document_id, applicant_name, document_type, issue_date, expiry_date, status, created_at FROM documents WHERE UPPER(document_id) = ?",
      [documentId]
    );

    if (!doc) {
      return res.json({ found: false, message: "No document found with this ID. Please check the number and try again." });
    }

    const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
    const effectiveStatus = isExpired ? "expired" : doc.status;

    res.json({
      found: true,
      document: {
        document_id: doc.document_id,
        applicant_name: doc.applicant_name,
        document_type: doc.document_type,
        issue_date: doc.issue_date,
        expiry_date: doc.expiry_date,
        status: effectiveStatus,
        verified_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// Admin: list all documents
router.get("/", authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const docs = await db.all("SELECT * FROM documents ORDER BY created_at DESC");
    res.json({ documents: docs });
  } catch (err) {
    console.error("List documents error:", err);
    res.status(500).json({ error: "Failed to load documents" });
  }
});

// Admin: get single document
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const doc = await db.get("SELECT * FROM documents WHERE id = ?", [req.params.id]);
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.json({ document: doc });
  } catch (err) {
    res.status(500).json({ error: "Failed to load document" });
  }
});

// Admin: create document
router.post("/", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const db = await getDb();
    const {
      document_id,
      applicant_name,
      document_type,
      issue_date,
      expiry_date,
      status,
      notes
    } = req.body;

    if (!applicant_name || !document_type) {
      return res.status(400).json({ error: "Applicant name and document type are required" });
    }

    const docId = (document_id || generateDocumentId()).trim().toUpperCase();
    const existing = await db.get("SELECT id FROM documents WHERE UPPER(document_id) = ?", [docId]);
    if (existing) {
      return res.status(409).json({ error: "Document ID already exists" });
    }

    const fileName = req.file ? req.file.originalname : null;
    const filePath = req.file ? `/uploads/documents/${req.file.filename}` : null;

    const result = await db.run(
      `INSERT INTO documents (document_id, applicant_name, document_type, issue_date, expiry_date, status, notes, file_name, file_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        docId,
        applicant_name.trim(),
        document_type.trim(),
        issue_date || null,
        expiry_date || null,
        status || "active",
        notes || null,
        fileName,
        filePath
      ]
    );

    const doc = await db.get("SELECT * FROM documents WHERE document_id = ?", [docId]);
    res.status(201).json({ document: doc, id: result.lastInsertRowid });
  } catch (err) {
    console.error("Create document error:", err);
    res.status(500).json({ error: err.message || "Failed to create document" });
  }
});

// Admin: update document
router.put("/:id", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const db = await getDb();
    const existing = await db.get("SELECT * FROM documents WHERE id = ?", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Document not found" });

    const {
      document_id,
      applicant_name,
      document_type,
      issue_date,
      expiry_date,
      status,
      notes
    } = req.body;

    let fileName = existing.file_name;
    let filePath = existing.file_path;
    if (req.file) {
      fileName = req.file.originalname;
      filePath = `/uploads/documents/${req.file.filename}`;
    }

    await db.run(
      `UPDATE documents SET
        document_id = ?, applicant_name = ?, document_type = ?,
        issue_date = ?, expiry_date = ?, status = ?, notes = ?,
        file_name = ?, file_path = ?, updated_at = ?
       WHERE id = ?`,
      [
        (document_id || existing.document_id).trim().toUpperCase(),
        (applicant_name || existing.applicant_name).trim(),
        (document_type || existing.document_type).trim(),
        issue_date !== undefined ? issue_date : existing.issue_date,
        expiry_date !== undefined ? expiry_date : existing.expiry_date,
        status || existing.status,
        notes !== undefined ? notes : existing.notes,
        fileName,
        filePath,
        new Date().toISOString(),
        req.params.id
      ]
    );

    const doc = await db.get("SELECT * FROM documents WHERE id = ?", [req.params.id]);
    res.json({ document: doc });
  } catch (err) {
    console.error("Update document error:", err);
    res.status(500).json({ error: "Failed to update document" });
  }
});

// Admin: delete document
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const existing = await db.get("SELECT * FROM documents WHERE id = ?", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Document not found" });

    if (existing.file_path) {
      const fullPath = path.join(__dirname, "..", "..", existing.file_path.replace(/^\//, ""));
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    await db.run("DELETE FROM documents WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete document error:", err);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

module.exports = router;
