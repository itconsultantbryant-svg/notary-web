"use strict";

const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { getDb } = require("../db");
const { authMiddleware } = require("../middleware/auth");
const { getRequestMeta } = require("../utils/request-meta");
const { trackVerification } = require("../analytics-data");

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

function resolveDiskPath(filePath) {
  if (!filePath) return null;
  const base = getUploadsDir();
  if (filePath.startsWith("/uploads/documents/")) {
    const name = path.basename(filePath);
    return path.join(base, name);
  }
  if (filePath.startsWith("documents/")) {
    return path.join(base, filePath.replace(/^documents\//, ""));
  }
  return path.join(base, path.basename(filePath));
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

function formatDateTime(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toISOString().slice(0, 19).replace("T", " ");
  } catch {
    return iso;
  }
}

// Public verification
router.get("/verify/:documentId", async (req, res) => {
  try {
    const documentId = req.params.documentId.trim().toUpperCase();
    const visitorId = req.query.visitor_id || req.headers["x-visitor-id"] || null;
    const db = await getDb();
    const meta = getRequestMeta(req);

    const doc = await db.get(
      "SELECT document_id, applicant_name, document_type, issue_date, expiry_date, status, notes, file_name, created_at, updated_at FROM documents WHERE UPPER(document_id) = ?",
      [documentId]
    );

    const logVerification = async (found, status) => {
      try {
        await trackVerification(db, {
          document_id: documentId,
          found,
          status,
          visitor_id: visitorId,
          country: meta.country,
          city: meta.city,
          region: meta.region,
          user_agent: meta.user_agent
        });
      } catch (e) {
        console.warn("Verification log error:", e.message);
      }
    };

    if (!doc) {
      await logVerification(false, "not_found");
      return res.json({ found: false, message: "No document found with this ID. Please check the number and try again." });
    }

    const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
    const effectiveStatus = isExpired ? "expired" : doc.status;

    if (effectiveStatus === "pending") {
      await logVerification(true, "pending");
      return res.json({
        found: true,
        pending: true,
        message: "This document is registered with our office but is still pending final verification. Please contact us for assistance."
      });
    }

    if (effectiveStatus === "revoked") {
      await logVerification(true, "revoked");
      return res.json({
        found: true,
        document: {
          document_id: doc.document_id,
          applicant_name: doc.applicant_name,
          document_type: doc.document_type,
          issue_date: doc.issue_date,
          expiry_date: doc.expiry_date,
          status: effectiveStatus,
          registered_at: formatDateTime(doc.created_at),
          verified_at: new Date().toISOString()
        },
        notice: "This document has been revoked and is no longer valid."
      });
    }

    await logVerification(true, effectiveStatus);

    res.json({
      found: true,
      document: {
        document_id: doc.document_id,
        applicant_name: doc.applicant_name,
        document_type: doc.document_type,
        issue_date: doc.issue_date,
        expiry_date: doc.expiry_date,
        status: effectiveStatus,
        has_file: Boolean(doc.file_name),
        registered_at: formatDateTime(doc.created_at),
        verified_at: new Date().toISOString()
      },
      notice: "Verification confirms this document is on file with our office. Digital copies are not available for download — contact us via WhatsApp for certified hard copies."
    });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// Admin: secure file download / preview
router.get("/:id/file", authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const doc = await db.get("SELECT file_name, file_path FROM documents WHERE id = ?", [req.params.id]);
    if (!doc?.file_path) return res.status(404).json({ error: "No file attached" });

    const diskPath = resolveDiskPath(doc.file_path);
    if (!diskPath || !fs.existsSync(diskPath)) {
      return res.status(404).json({ error: "File not found on server" });
    }

    const download = req.query.download === "1";
    if (download) {
      res.download(diskPath, doc.file_name || path.basename(diskPath));
    } else {
      res.sendFile(diskPath);
    }
  } catch (err) {
    console.error("File serve error:", err);
    res.status(500).json({ error: "Failed to load file" });
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
  if (req.params.id === "verify") return res.status(404).json({ error: "Not found" });
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
    const filePath = req.file ? req.file.filename : null;
    const docStatus = status || (req.file ? "pending" : "active");

    const result = await db.run(
      `INSERT INTO documents (document_id, applicant_name, document_type, issue_date, expiry_date, status, notes, file_name, file_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        docId,
        applicant_name.trim(),
        document_type.trim(),
        issue_date || null,
        expiry_date || null,
        docStatus,
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
      if (existing.file_path) {
        const oldPath = resolveDiskPath(existing.file_path);
        if (oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      fileName = req.file.originalname;
      filePath = req.file.filename;
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
      const fullPath = resolveDiskPath(existing.file_path);
      if (fullPath && fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    await db.run("DELETE FROM documents WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete document error:", err);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

module.exports = router;
