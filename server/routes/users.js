"use strict";

const express = require("express");
const bcrypt = require("bcryptjs");
const { getDb } = require("../db");
const { authMiddleware, requirePermission } = require("../middleware/auth");
const { PERMISSIONS, ROLE_PERMISSIONS, publicUser } = require("../access");

const router = express.Router();
router.use(authMiddleware, requirePermission("staff.manage"));

function cleanUser(body) {
  const email = String(body.email || "").trim().toLowerCase();
  const name = String(body.name || "").trim();
  const role = String(body.role || "clerk");
  const permissions = Array.isArray(body.permissions) ? [...new Set(body.permissions.filter((p) => PERMISSIONS.includes(p) && p !== "staff.manage"))] : (ROLE_PERMISSIONS[role] || []).filter((p) => p !== "staff.manage");
  return { email, name, role, permissions, active: body.active !== false };
}

router.get("/permissions", (req, res) => res.json({ permissions: PERMISSIONS, roles: ROLE_PERMISSIONS }));
router.get("/", async (req, res) => {
  try {
    const db = await getDb();
    const users = await db.all("SELECT * FROM admin_users ORDER BY created_at DESC");
    res.json({ users: users.map(publicUser) });
  } catch (err) { console.error("List users error:", err); res.status(500).json({ error: "Failed to load staff users" }); }
});

router.post("/", async (req, res) => {
  try {
    const { email, name, role, permissions, active } = cleanUser(req.body || {});
    const password = req.body?.password;
    if (!name || name.length > 255) return res.status(400).json({ error: "A staff name is required" });
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 255) return res.status(400).json({ error: "Enter a valid email address" });
    if (!password || typeof password !== "string" || password.length < 8 || password.length > 128) return res.status(400).json({ error: "Password must be between 8 and 128 characters" });
    if (!Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, role) || role === "administrator") return res.status(400).json({ error: "Choose a valid staff role" });
    const db = await getDb();
    if (await db.get("SELECT id FROM admin_users WHERE email = ?", [email])) return res.status(409).json({ error: "A user with this email already exists" });
    const hash = await bcrypt.hash(password, 12);
    await db.run("INSERT INTO admin_users (email, password_hash, name, role, permissions, active) VALUES (?, ?, ?, ?, ?, ?)", [email, hash, name, role, JSON.stringify(permissions), active]);
    const user = await db.get("SELECT * FROM admin_users WHERE email = ?", [email]);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) { console.error("Create user error:", err); res.status(500).json({ error: "Failed to create staff user" }); }
});

router.put("/:id", async (req, res) => {
  try {
    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: "Invalid user ID" });
    const db = await getDb();
    const existing = await db.get("SELECT * FROM admin_users WHERE id = ?", [req.params.id]);
    if (!existing) return res.status(404).json({ error: "Staff user not found" });
    if ((existing.role || "administrator") === "administrator") return res.status(403).json({ error: "Administrator accounts cannot be changed here" });
    const { name, role, permissions, active } = cleanUser({ ...existing, ...req.body });
    if (!name || !Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, role) || role === "administrator") return res.status(400).json({ error: "Invalid staff details" });
    await db.run("UPDATE admin_users SET name = ?, role = ?, permissions = ?, active = ? WHERE id = ?", [name, role, JSON.stringify(permissions), active, req.params.id]);
    const user = await db.get("SELECT * FROM admin_users WHERE id = ?", [req.params.id]);
    res.json({ user: publicUser(user) });
  } catch (err) { console.error("Update user error:", err); res.status(500).json({ error: "Failed to update staff user" }); }
});

router.put("/:id/password", async (req, res) => {
  try {
    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: "Invalid user ID" });
    const password = req.body?.password;
    if (!password || typeof password !== "string" || password.length < 8 || password.length > 128) return res.status(400).json({ error: "Password must be between 8 and 128 characters" });
    const db = await getDb();
    const user = await db.get("SELECT * FROM admin_users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: "Staff user not found" });
    if ((user.role || "administrator") === "administrator") return res.status(403).json({ error: "Use Settings to change an administrator password" });
    const hash = await bcrypt.hash(password, 12);
    await db.run("UPDATE admin_users SET password_hash = ?, password_reset_requested_at = ? WHERE id = ?", [hash, null, req.params.id]);
    res.json({ ok: true, message: "Staff password updated" });
  } catch (err) { console.error("Reset staff password error:", err); res.status(500).json({ error: "Failed to update staff password" }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const db = await getDb(); const user = await db.get("SELECT * FROM admin_users WHERE id = ?", [req.params.id]);
    if (!user) return res.status(404).json({ error: "Staff user not found" });
    if ((user.role || "administrator") === "administrator") return res.status(403).json({ error: "Administrator accounts cannot be deleted" });
    await db.run("DELETE FROM admin_users WHERE id = ?", [req.params.id]); res.json({ ok: true });
  } catch (err) { console.error("Delete user error:", err); res.status(500).json({ error: "Failed to delete staff user" }); }
});
module.exports = router;
