#!/usr/bin/env node
"use strict";
/**
 * Patches all HTML pages with SEO, CMS, nav, and script enhancements.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE_URL = "https://www.jeffersonteahnotarypublic.com";

const htmlFiles = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html") && f !== "new_blog.html");

const VERIFY_NAV = '<li class="nav-item"><a class="nav-link" href="verify.html">Verify Document</a></li>';
const GALLERY_NAV = '<li class="nav-item"><a class="nav-link" href="gallery.html">Gallery</a></li>';

const SEO_HEAD = `
  <link rel="canonical" href="{{CANONICAL}}" />
  <meta name="robots" content="index, follow" />
  <meta property="og:url" content="{{CANONICAL}}" />
  <meta property="og:site_name" content="Hon. Jefferson Teah Notary Public Office" />
  <meta name="geo.region" content="LR-MO" />
  <meta name="geo.placename" content="Monrovia, Liberia" />`;

const SCRIPTS = `
  <script src="assets/js/cms-loader.js"></script>
  <script src="assets/js/site-enhancements.js"></script>`;

const JSON_LD = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LegalService",
    "name": "Hon. Jefferson Teah Notary Public Office",
    "url": "https://www.jeffersonteahnotarypublic.com",
    "logo": "https://www.jeffersonteahnotarypublic.com/assets/img/notary_logo.png",
    "image": "https://www.jeffersonteahnotarypublic.com/assets/img/notary_logo.png",
    "description": "Certified notarial services in Monrovia, Liberia — document notarization, affidavits, certified copies, powers of attorney, and contract witnessing.",
    "telephone": ["+231770388279", "+231886767621"],
    "email": "info@jeffersonteahnotarypublic.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Bye Pass, Bassa Community, Techno House",
      "addressLocality": "Monrovia",
      "addressCountry": "LR"
    },
    "areaServed": { "@type": "Country", "name": "Liberia" },
    "priceRange": "$$",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
      "opens": "08:00",
      "closes": "17:00"
    },
    "sameAs": []
  }
  </script>`;

function pageSlug(filename) {
  const base = filename.replace(".html", "");
  return base === "index" ? "index" : base;
}

function canonicalUrl(filename) {
  if (filename === "index.html") return SITE_URL + "/";
  return SITE_URL + "/" + filename;
}

function patchFile(filename) {
  const filePath = path.join(ROOT, filename);
  let html = fs.readFileSync(filePath, "utf8");
  const slug = pageSlug(filename);
  const canonical = canonicalUrl(filename);

  // data-page on body
  if (!html.includes("data-page=")) {
    html = html.replace(/<body([^>]*)>/, `<body$1 data-page="${slug}">`);
  }

  // SEO head tags
  if (!html.includes('rel="canonical"')) {
    const seoBlock = SEO_HEAD.replace(/\{\{CANONICAL\}\}/g, canonical);
    html = html.replace("</head>", seoBlock + "\n</head>");
  } else {
    html = html.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${canonical}"`);
    html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${canonical}"`);
  }

  // JSON-LD on index only
  if (filename === "index.html" && !html.includes("application/ld+json")) {
    html = html.replace("</head>", JSON_LD + "\n</head>");
  }

  // Verify nav link
  if (!html.includes('href="verify.html"') && html.includes('navbar-nav')) {
    if (html.includes(GALLERY_NAV)) {
      html = html.replace(GALLERY_NAV, GALLERY_NAV + "\n            " + VERIFY_NAV);
    } else if (html.includes('href="request-quote.html"')) {
      html = html.replace(
        /<li class="nav-item ms-lg-3">\s*<a class="btn btn-primary"/,
        VERIFY_NAV + "\n            <li class=\"nav-item ms-lg-3\"><a class=\"btn btn-primary\""
      );
    }
  }

  // Gallery nav where missing
  if (!html.includes('href="gallery.html"') && html.includes('navbar-nav') && filename !== "gallery.html") {
    html = html.replace(
      /<li class="nav-item ms-lg-3">\s*<a class="btn btn-primary"/,
      GALLERY_NAV + "\n            <li class=\"nav-item ms-lg-3\"><a class=\"btn btn-primary\""
    );
  }

  // CMS scripts before closing body
  if (!html.includes("cms-loader.js")) {
    html = html.replace(
      /<script src="assets\/js\/main\.js"><\/script>/,
      `<script src="assets/js/main.js"></script>${SCRIPTS}`
    );
  }

  // Update og:image to absolute URL on main pages
  html = html.replace(
    /content="assets\/img\/og-image\.svg"/g,
    `content="${SITE_URL}/assets/img/notary_logo.png"`
  );

  fs.writeFileSync(filePath, html);
  console.log("Patched:", filename);
}

htmlFiles.forEach(patchFile);
console.log("Done. Patched", htmlFiles.length, "files.");
