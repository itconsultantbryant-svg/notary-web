#!/usr/bin/env node
"use strict";

require("dotenv").config();

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL not set — skipping database init.");
  console.log("After deploy, run: GET /api/setup?secret=YOUR_JWT_SECRET");
  process.exit(0);
}

const { initializeDatabase } = require("../server/init");

initializeDatabase()
  .then((result) => {
    console.log("Database initialized successfully.");
    if (result.admin.created) {
      console.log(`Admin user created: ${result.admin.email}`);
      console.log(`Password: ${result.admin.password} (change after first login)`);
    }
    if (result.documentsCreated) {
      console.log(`Sample documents created: ${result.documentsCreated}`);
    }
  })
  .catch((err) => {
    console.error("Init failed:", err.message || err);
    process.exit(1);
  });
