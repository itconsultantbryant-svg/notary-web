"use strict";

const { usePostgres } = require("./db");

async function trackPageView(db, data) {
  await db.run(
    `INSERT INTO page_views (visitor_id, page_path, referrer, country, city, region, user_agent, duration_seconds)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.visitor_id || null,
      data.page_path,
      data.referrer || null,
      data.country || null,
      data.city || null,
      data.region || null,
      data.user_agent || null,
      Number(data.duration_seconds) || 0
    ]
  );
}

async function trackVerification(db, data) {
  await db.run(
    `INSERT INTO verification_logs (document_id, found, status, visitor_id, country, city, region, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.document_id || null,
      Boolean(data.found),
      data.status || null,
      data.visitor_id || null,
      data.country || null,
      data.city || null,
      data.region || null,
      data.user_agent || null
    ]
  );
}

async function getAnalyticsStats(db) {
  const isPg = usePostgres();
  const todaySql = isPg
    ? "created_at >= CURRENT_DATE"
    : "date(created_at) = date('now')";
  const weekSql = isPg
    ? "created_at >= NOW() - INTERVAL '7 days'"
    : "created_at >= datetime('now', '-7 days')";

  const visitorsToday = await db.get(
    `SELECT COUNT(DISTINCT visitor_id) AS count FROM page_views WHERE visitor_id IS NOT NULL AND ${todaySql}`
  );
  const pageViewsToday = await db.get(
    `SELECT COUNT(*) AS count FROM page_views WHERE ${todaySql}`
  );
  const pageViewsWeek = await db.get(
    `SELECT COUNT(*) AS count FROM page_views WHERE ${weekSql}`
  );
  const uniqueVisitorsWeek = await db.get(
    `SELECT COUNT(DISTINCT visitor_id) AS count FROM page_views WHERE visitor_id IS NOT NULL AND ${weekSql}`
  );
  const avgDuration = await db.get(
    `SELECT AVG(duration_seconds) AS avg FROM page_views WHERE duration_seconds > 0 AND ${weekSql}`
  );
  const verificationsToday = await db.get(
    `SELECT COUNT(*) AS count FROM verification_logs WHERE ${todaySql}`
  );
  const verificationsWeek = await db.get(
    `SELECT COUNT(*) AS count FROM verification_logs WHERE ${weekSql}`
  );
  const successfulVerifications = await db.get(
    `SELECT COUNT(*) AS count FROM verification_logs WHERE found = ${isPg ? "TRUE" : "1"} AND ${weekSql}`
  );

  const topPages = await db.all(
    `SELECT page_path, COUNT(*) AS views FROM page_views WHERE ${weekSql} GROUP BY page_path ORDER BY views DESC LIMIT 8`
  );
  const topLocations = await db.all(
    `SELECT country, city, COUNT(*) AS views FROM page_views
     WHERE country IS NOT NULL AND ${weekSql}
     GROUP BY country, city ORDER BY views DESC LIMIT 8`
  );
  const recentVerifications = await db.all(
    `SELECT * FROM verification_logs ORDER BY created_at DESC LIMIT 25`
  );
  const recentPageViews = await db.all(
    `SELECT * FROM page_views ORDER BY created_at DESC LIMIT 20`
  );

  return {
    visitorsToday: Number(visitorsToday?.count ?? 0),
    pageViewsToday: Number(pageViewsToday?.count ?? 0),
    pageViewsWeek: Number(pageViewsWeek?.count ?? 0),
    uniqueVisitorsWeek: Number(uniqueVisitorsWeek?.count ?? 0),
    avgDurationSeconds: Math.round(Number(avgDuration?.avg ?? 0)),
    verificationsToday: Number(verificationsToday?.count ?? 0),
    verificationsWeek: Number(verificationsWeek?.count ?? 0),
    successfulVerifications: Number(successfulVerifications?.count ?? 0),
    topPages: topPages || [],
    topLocations: topLocations || [],
    recentVerifications: recentVerifications || [],
    recentPageViews: recentPageViews || []
  };
}

module.exports = { trackPageView, trackVerification, getAnalyticsStats };
