"use strict";

const jwt = require("jsonwebtoken");
const { getDb } = require("../db");
const { permissionsFor } = require("../access");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  const cookieToken = req.cookies && req.cookies.admin_token;
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : cookieToken;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const tokenUser = jwt.verify(token, JWT_SECRET);
    const db = await getDb();
    const user = await db.get("SELECT * FROM admin_users WHERE id = ?", [tokenUser.id]);
    if (!user || user.active === false || user.active === 0) return res.status(401).json({ error: "Your account is unavailable" });
    req.user = { ...tokenUser, role: user.role || "administrator", permissions: permissionsFor(user) };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requirePermission(permission) {
  return (req, res, next) => req.user?.permissions.includes(permission)
    ? next()
    : res.status(403).json({ error: "You do not have permission to perform this action" });
}

async function findAdminByEmail(email) {
  const db = await getDb();
  return db.get("SELECT * FROM admin_users WHERE email = ?", [email]);
}

module.exports = { signToken, authMiddleware, requirePermission, findAdminByEmail, JWT_SECRET };
