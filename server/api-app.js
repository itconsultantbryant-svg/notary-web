"use strict";

require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const documentRoutes = require("./routes/documents");
const cmsRoutes = require("./routes/cms");
const contactRoutes = require("./routes/contact");

/** API-only app for Vercel serverless (no static file serving). */
function createApiApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use("/api/auth", authRoutes);
  app.use("/api/documents", documentRoutes);
  app.use("/api/cms", cmsRoutes);
  app.use("/api/contact", contactRoutes);

  app.get("/api/health", async (req, res) => {
    try {
      const { getDb, usePostgres } = require("./db");
      await getDb();
      res.json({
        ok: true,
        site: process.env.SITE_URL || "https://www.jeffersonteahnotarypublic.com",
        db: usePostgres() ? "postgres" : "json"
      });
    } catch (err) {
      console.error("Health check failed:", err);
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  app.use((err, req, res, next) => {
    console.error("API error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  });

  return app;
}

module.exports = createApiApp;
