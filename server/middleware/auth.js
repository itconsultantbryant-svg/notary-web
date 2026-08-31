"use strict";

const jwt = require("jsonwebtoken");
const { getDb } = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  const cookieToken = req.cookies && req.cookies.admin_token;
  const token = header && header.startsWith("Bearer ") ? header.slice(7) : cookieToken;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

async function findAdminByEmail(email) {
  const db = await getDb();
  return db.get("SELECT * FROM admin_users WHERE email = ?", [email]);
}

module.exports = { signToken, authMiddleware, findAdminByEmail, JWT_SECRET };
