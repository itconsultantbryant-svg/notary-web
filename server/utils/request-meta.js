"use strict";

const crypto = require("crypto");

function getRequestMeta(req) {
  const country = req.headers["x-vercel-ip-country"] || null;
  const city = decodeHeader(req.headers["x-vercel-ip-city"]);
  const region = req.headers["x-vercel-ip-country-region"] || null;
  const userAgent = req.headers["user-agent"] || null;
  const forwarded = req.headers["x-forwarded-for"];
  const ip = (typeof forwarded === "string" ? forwarded.split(",")[0] : forwarded?.[0])?.trim()
    || req.socket?.remoteAddress
    || "";
  const salt = process.env.JWT_SECRET || "notary-ip-salt";
  const ipHash = ip
    ? crypto.createHash("sha256").update(`${ip}:${salt}`).digest("hex").slice(0, 16)
    : null;

  return { country, city, region, user_agent: userAgent, ip_hash: ipHash };
}

function decodeHeader(value) {
  if (!value) return null;
  try {
    return decodeURIComponent(String(value).replace(/\+/g, " "));
  } catch {
    return value;
  }
}

module.exports = { getRequestMeta };
