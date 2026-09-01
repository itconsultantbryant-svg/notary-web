"use strict";

require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const documentRoutes = require("./routes/documents");
const cmsRoutes = require("./routes/cms");
const contactRoutes = require("./routes/contact");

function createApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/cms", cmsRoutes);
  app.use("/api/contact", contactRoutes);
  app.use("/api/analytics", require("./routes/analytics"));

  // Block public access to uploaded documents (admin-only via API)
  app.get("/uploads/documents/*", (req, res) => {
    res.status(403).json({ error: "Document files are not publicly accessible. Use document verification or contact the office." });
  });

  // Admin dashboard
  app.use("/admin", express.static(path.join(__dirname, "..", "admin")));

  // Static site files
  const root = path.join(__dirname, "..");
  app.use(express.static(root, {
    index: "index.html",
    extensions: ["html"]
  }));

  // SPA fallback for admin
  app.get("/admin/*", (req, res) => {
    res.sendFile(path.join(root, "admin", "index.html"));
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ ok: true, site: process.env.SITE_URL || "https://www.jeffersonteahnotarypublic.com" });
  });

  return app;
}

module.exports = createApp;
