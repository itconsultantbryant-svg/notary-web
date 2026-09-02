#!/usr/bin/env node
"use strict";

/**
 * Applies SEO titles, descriptions, and keywords to all public HTML pages.
 */
const fs = require("fs");
const path = require("path");
const { SEO } = require("./seo-config");

const ROOT = path.join(__dirname, "..");

function upsertMeta(html, name, content) {
  const re = new RegExp(`<meta name="${name}" content="[^"]*"\\s*/>`, "i");
  const tag = `<meta name="${name}" content="${content.replace(/"/g, "&quot;")}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<meta name="viewport"[^>]*>/i, (m) => `${m}\n  ${tag}`);
}

function upsertTitle(html, title) {
  return html.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);
}

function upsertOg(html, prop, content) {
  const re = new RegExp(`<meta property="${prop}" content="[^"]*"\\s*/>`, "i");
  const tag = `<meta property="${prop}" content="${content.replace(/"/g, "&quot;")}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html;
}

function addSeoExtras(html) {
  const extras = [
    `<meta name="subject" content="Notary Public Services in Monrovia, Liberia" />`,
    `<meta name="coverage" content="Liberia" />`,
    `<meta name="language" content="English" />`
  ];
  for (const tag of extras) {
    const name = tag.match(/name="([^"]+)"/)[1];
    if (!html.includes(`name="${name}"`)) {
      html = html.replace(/<meta name="author"[^>]*>/i, (m) => `${m}\n  ${tag}`);
    }
  }
  return html;
}

function patchFile(filename) {
  const config = SEO[filename];
  if (!config) return false;

  const filePath = path.join(ROOT, filename);
  if (!fs.existsSync(filePath)) return false;

  let html = fs.readFileSync(filePath, "utf8");
  html = upsertTitle(html, config.title);
  html = upsertMeta(html, "description", config.description);
  html = upsertMeta(html, "keywords", config.keywords);
  html = upsertOg(html, "og:title", config.title);
  html = upsertOg(html, "og:description", config.description);
  html = addSeoExtras(html);

  fs.writeFileSync(filePath, html);
  return true;
}

let count = 0;
for (const file of Object.keys(SEO)) {
  if (patchFile(file)) {
    console.log("✓", file);
    count++;
  }
}
console.log(`\nUpdated SEO on ${count} pages.`);
