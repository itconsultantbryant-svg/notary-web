#!/usr/bin/env node
"use strict";
/**
 * Post-deploy smoke test — run against production URL:
 *   SITE_URL=https://www.jeffersonteahnotarypublic.com node scripts/check-deploy.js
 */
const BASE = process.env.SITE_URL || "https://www.jeffersonteahnotarypublic.com";

const checks = [
  { name: "Homepage", url: "/", expect: ["cms-loader.js", "site-enhancements.js"] },
  { name: "Verify page", url: "/verify", expect: ["Verify Your Document", "verifyForm"] },
  { name: "CMS loader JS", url: "/assets/js/cms-loader.js", expect: ["data-cms"] },
  { name: "Updated main.js", url: "/assets/js/main.js", expect: ["/api/contact"] },
  { name: "Admin panel", url: "/admin", expect: ["Admin Dashboard", "admin.js"] },
  { name: "API health", url: "/api/health", expect: ['"ok":true'], json: true }
];

async function run() {
  console.log("Checking deployment at:", BASE, "\n");
  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      const res = await fetch(BASE + check.url);
      const body = await res.text();
      const ok = res.ok && check.expect.every((s) => body.includes(s));
      if (ok) {
        console.log("✓", check.name);
        passed++;
      } else {
        console.log("✗", check.name, `(${res.status}) — missing:`, check.expect.filter((s) => !body.includes(s)).join(", "));
        failed++;
      }
    } catch (err) {
      console.log("✗", check.name, "—", err.message);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("\nIf checks fail after pushing, redeploy on Vercel:");
    console.log("  Dashboard → Deployments → latest → Redeploy (uncheck 'Use existing Build Cache')");
    process.exit(1);
  }
}

run();
