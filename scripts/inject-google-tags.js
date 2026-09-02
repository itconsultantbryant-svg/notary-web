#!/usr/bin/env node
"use strict";

/**
 * Injects Google Search Console / Analytics / Tag Manager snippets into index.html
 * during Vercel build. Set env vars in Vercel Project Settings:
 *
 *   GOOGLE_SITE_VERIFICATION=abc123...     (HTML meta tag method)
 *   GA_MEASUREMENT_ID=G-XXXXXXXXXX         (Google Analytics method)
 *   GTM_CONTAINER_ID=GTM-XXXXXXX           (Tag Manager method)
 */
require("dotenv").config();

const fs = require("fs");
const path = require("path");

const indexPath = path.join(__dirname, "..", "index.html");
let html = fs.readFileSync(indexPath, "utf8");

const headTags = [];
const bodyTags = [];

const verification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
const gaId = process.env.GA_MEASUREMENT_ID?.trim();
const gtmId = process.env.GTM_CONTAINER_ID?.trim();

if (verification) {
  headTags.push(
    `  <meta name="google-site-verification" content="${verification}" />`
  );
}

if (gaId) {
  headTags.push(
    `  <!-- Google Analytics -->`,
    `  <script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>`,
    `  <script>`,
    `    window.dataLayer = window.dataLayer || [];`,
    `    function gtag(){dataLayer.push(arguments);}`,
    `    gtag('js', new Date());`,
    `    gtag('config', '${gaId}');`,
    `  </script>`
  );
}

if (gtmId) {
  headTags.push(
    `  <!-- Google Tag Manager -->`,
    `  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':`,
    `  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],`,
    `  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=`,
    `  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);`,
    `  })(window,document,'script','dataLayer','${gtmId}');</script>`
  );
  bodyTags.push(
    `  <!-- Google Tag Manager (noscript) -->`,
    `  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"`,
    `  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`
  );
}

const headBlock = headTags.length
  ? `  <!-- google-tags:start -->\n${headTags.join("\n")}\n  <!-- google-tags:end -->`
  : `  <!-- google-tags:start -->\n  <!-- Set GOOGLE_SITE_VERIFICATION, GA_MEASUREMENT_ID, or GTM_CONTAINER_ID in Vercel env -->\n  <!-- google-tags:end -->`;

const bodyBlock = bodyTags.length
  ? `  <!-- google-tags-body:start -->\n${bodyTags.join("\n")}\n  <!-- google-tags-body:end -->`
  : `  <!-- google-tags-body:start -->\n  <!-- google-tags-body:end -->`;

if (!html.includes("<!-- google-tags:start -->")) {
  html = html.replace(
    /(\s*<script type="application\/ld\+json">)/,
    `\n  <!-- google-tags:start -->\n  <!-- Set GOOGLE_SITE_VERIFICATION, GA_MEASUREMENT_ID, or GTM_CONTAINER_ID in Vercel env -->\n  <!-- google-tags:end -->\n$1`
  );
}

if (!html.includes("<!-- google-tags-body:start -->")) {
  html = html.replace(
    /<body([^>]*)>/,
    (match) => `${match}\n\n  <!-- google-tags-body:start -->\n  <!-- google-tags-body:end -->`
  );
}

html = html.replace(/<!-- google-tags:start -->[\s\S]*?<!-- google-tags:end -->/, headBlock);

if (html.includes("<!-- google-tags-body:start -->")) {
  html = html.replace(/<!-- google-tags-body:start -->[\s\S]*?<!-- google-tags-body:end -->/, bodyBlock);
} else {
  html = html.replace(/<body([^>]*)>/, (match) => `${match}\n${bodyBlock}`);
}

fs.writeFileSync(indexPath, html);

const active = [
  verification && "GOOGLE_SITE_VERIFICATION",
  gaId && "GA_MEASUREMENT_ID",
  gtmId && "GTM_CONTAINER_ID"
].filter(Boolean);

console.log(
  active.length
    ? `Google tags injected: ${active.join(", ")}`
    : "No Google tag env vars set — homepage markers left as placeholders."
);
