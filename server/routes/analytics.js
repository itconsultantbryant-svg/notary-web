"use strict";

const express = require("express");
const { getDb } = require("../db");
const { authMiddleware } = require("../middleware/auth");
const { getRequestMeta } = require("../utils/request-meta");
const { trackPageView, trackVerification, getAnalyticsStats } = require("../analytics-data");

const router = express.Router();

// Public: track page views / session duration
router.post("/track", async (req, res) => {
  try {
    const { visitor_id, page_path, referrer, duration_seconds } = req.body || {};
    if (!page_path) {
      return res.status(400).json({ error: "page_path is required" });
    }

    const meta = getRequestMeta(req);
    const db = await getDb();
    await trackPageView(db, {
      visitor_id: visitor_id || null,
      page_path: String(page_path).slice(0, 500),
      referrer: referrer ? String(referrer).slice(0, 500) : null,
      duration_seconds: Number(duration_seconds) || 0,
      country: meta.country,
      city: meta.city,
      region: meta.region,
      user_agent: meta.user_agent
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Analytics track error:", err);
    res.status(500).json({ error: "Failed to record visit" });
  }
});

// Admin: full analytics dashboard data
router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const stats = await getAnalyticsStats(db);
    res.json(stats);
  } catch (err) {
    console.error("Analytics stats error:", err);
    res.status(500).json({ error: "Failed to load analytics" });
  }
});

// Admin: sidebar summary (lightweight)
router.get("/summary", authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const stats = await getAnalyticsStats(db);
    res.json({
      visitorsToday: stats.visitorsToday,
      pageViewsToday: stats.pageViewsToday,
      verificationsToday: stats.verificationsToday,
      verificationsWeek: stats.verificationsWeek
    });
  } catch (err) {
    console.error("Analytics summary error:", err);
    res.status(500).json({ error: "Failed to load summary" });
  }
});

module.exports = router;