"use strict";

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { getDb } = require("../server/db");
const { getSchema } = require("../server/schema");

const CMS_SEED = [
  {
    slug: "index",
    title: "Reliable Notarial Services You Can Trust | Hon. Jefferson Teah Notary Public Office — Monrovia, Liberia",
    meta_description: "Certified and trusted notarial services in Monrovia, Liberia. Document notarization, affidavits, certified true copies, deed & contract witnessing for individuals, businesses, and institutions.",
    blocks: [
      { key: "hero_eyebrow", label: "Hero Eyebrow", type: "text", content: "Certified & Trusted" },
      { key: "hero_title", label: "Hero Title", type: "html", content: "Reliable Notarial Services <span class=\"accent\">You Can Trust</span>" },
      { key: "hero_text", label: "Hero Description", type: "text", content: "We provide professional document notarization, certification, and legal witnessing services for individuals, businesses, and institutions across Liberia." },
      { key: "about_title", label: "About Section Title", type: "text", content: "Hon. Jefferson S. Teah Notary Office" },
      { key: "about_text", label: "About Section Text", type: "text", content: "Welcome to Hon. Jefferson S. Teah Notary Office — a professional notarial services office committed to reliable, accurate, and confidential service for individuals, businesses, and institutions in Liberia and beyond. We authenticate, certify, and formally execute documents in line with Liberian law." },
      { key: "why_title", label: "Why Choose Us Title", type: "text", content: "Dependable Notarial Support for Every Legal Need" },
      { key: "why_text", label: "Why Choose Us Text", type: "text", content: "Backed by licensed professionals and a commitment to speed, accuracy, and confidentiality." }
    ]
  },
  {
    slug: "about",
    title: "About Us | Hon. Jefferson Teah Notary Public Office — Monrovia, Liberia",
    meta_description: "Learn about Hon. Jefferson S. Teah Notary Public Office — licensed notaries serving Monrovia, Liberia with integrity, accuracy, and confidentiality.",
    blocks: [
      { key: "page_title", label: "Page Title", type: "text", content: "About Us" },
      { key: "intro_title", label: "Intro Title", type: "text", content: "A Trusted Notarial Institution in Liberia" },
      { key: "intro_text", label: "Intro Text", type: "text", content: "Hon. Jefferson S. Teah Notary Public Office is a professional notarial services institution committed to providing reliable, accurate, and confidential notarial services to individuals, businesses, and institutions across Liberia." }
    ]
  },
  {
    slug: "service",
    title: "Notarial Services | Hon. Jefferson Teah Notary Public Office — Monrovia, Liberia",
    meta_description: "Full range of notarial services in Monrovia: document notarization, affidavits, certified copies, powers of attorney, contract witnessing, and more.",
    blocks: [
      { key: "page_title", label: "Page Title", type: "text", content: "Our Services" },
      { key: "intro_text", label: "Intro Text", type: "text", content: "From a single signature to institutional document processing, we cover the full range of notarial needs under Liberian law." }
    ]
  },
  {
    slug: "faq",
    title: "FAQ | Hon. Jefferson Teah Notary Public Office — Monrovia, Liberia",
    meta_description: "Frequently asked questions about notarial services, required documents, office hours, and fees at Hon. Jefferson Teah Notary Public Office, Monrovia.",
    blocks: [
      { key: "page_title", label: "Page Title", type: "text", content: "Frequently Asked Questions" },
      { key: "intro_text", label: "Intro Text", type: "text", content: "Find answers to common questions about our notarial services, what to bring, and how we can help." }
    ]
  },
  {
    slug: "contact",
    title: "Contact Us | Hon. Jefferson Teah Notary Public Office — Monrovia, Liberia",
    meta_description: "Contact Hon. Jefferson Teah Notary Public Office in Bassa Community, Monrovia. Call +231770388279 or email info@jeffersonteahnotarypublic.com.",
    blocks: [
      { key: "page_title", label: "Page Title", type: "text", content: "Contact Us" },
      { key: "intro_text", label: "Intro Text", type: "text", content: "Reach our office by phone, email, or visit us in person. We respond to all inquiries promptly." }
    ]
  },
  {
    slug: "verify",
    title: "Verify Document | Hon. Jefferson Teah Notary Public Office",
    meta_description: "Verify the authenticity of notarized documents issued by Hon. Jefferson Teah Notary Public Office using your document ID.",
    blocks: [
      { key: "page_title", label: "Page Title", type: "text", content: "Verify Your Document" },
      { key: "intro_text", label: "Intro Text", type: "text", content: "Enter your document ID to confirm it was issued by our office and check its current status." }
    ]
  }
];

async function seedCms(db) {
  for (const page of CMS_SEED) {
    const exists = await db.get("SELECT slug FROM cms_pages WHERE slug = ?", [page.slug]);
    if (!exists) {
      await db.run(
        "INSERT INTO cms_pages (slug, title, meta_description) VALUES (?, ?, ?)",
        [page.slug, page.title, page.meta_description]
      );
    }

    for (const block of page.blocks) {
      const blockExists = await db.get(
        "SELECT id FROM cms_blocks WHERE page_slug = ? AND block_key = ?",
        [page.slug, block.key]
      );
      if (!blockExists) {
        await db.run(
          "INSERT INTO cms_blocks (page_slug, block_key, label, content_type, content) VALUES (?, ?, ?, ?, ?)",
          [page.slug, block.key, block.label, block.type, block.content]
        );
      }
    }
  }
}

async function seedAdmin(db) {
  const email = (process.env.ADMIN_EMAIL || "admin@jeffersonteahnotarypublic.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Admin@2026!";
  const existing = await db.get("SELECT id FROM admin_users WHERE email = ?", [email]);

  if (!existing) {
    const hash = await bcrypt.hash(password, 12);
    await db.run(
      "INSERT INTO admin_users (email, password_hash, name) VALUES (?, ?, ?)",
      [email, hash, "Administrator"]
    );
    console.log(`Admin user created: ${email}`);
    console.log(`Default password: ${password} (change after first login)`);
  }
}

async function seedDocuments(db) {
  const samples = [
    ["JTNP-2026-DOC001", "Sample Applicant", "Notarization Certificate", "2026-01-15", "2028-01-15", "active"],
    ["JTNP-2026-DOC002", "Sample Applicant", "Affidavit Certification", "2026-02-01", "2028-02-01", "active"]
  ];

  for (const [docId, name, type, issued, expires, status] of samples) {
    const exists = await db.get("SELECT id FROM documents WHERE document_id = ?", [docId]);
    if (!exists) {
      await db.run(
        "INSERT INTO documents (document_id, applicant_name, document_type, issue_date, expiry_date, status) VALUES (?, ?, ?, ?, ?, ?)",
        [docId, name, type, issued, expires, status]
      );
    }
  }
}

async function main() {
  const db = await getDb();
  const schema = getSchema();
  await db.exec(schema);
  await seedAdmin(db);
  await seedCms(db);
  await seedDocuments(db);
  console.log("Database initialized successfully.");
}

main().catch((err) => {
  console.error("Init failed:", err);
  process.exit(1);
});
