"use strict";

/**
 * SEO titles, descriptions, and keywords per public page.
 * Run: node scripts/apply-seo.js
 */
const SITE = "Hon. Jefferson Teah Notary Public Office";
const LOCATION = "Monrovia, Liberia";

const BASE_KEYWORDS = [
  "Hon Jefferson Teah notary public",
  "Jefferson Teah notary Monrovia",
  "notary public Monrovia",
  "notary public Liberia",
  "notary near me Monrovia",
  "licensed notary Liberia",
  "notary office Monrovia",
  "Bassa Community notary",
  "notary Techno House Monrovia"
].join(", ");

const SEO = {
  "index.html": {
    title: `Notary Public Monrovia Liberia | Certified Notarial Services | ${SITE}`,
    description:
      "Hon. Jefferson Teah Notary Public Office — certified notary in Monrovia, Liberia. Document notarization, affidavits, certified true copies, deed witnessing, power of attorney, and online document verification.",
    keywords: [
      BASE_KEYWORDS,
      "document notarization Monrovia",
      "affidavit notary Liberia",
      "certified true copies Monrovia",
      "deed witnessing Liberia",
      "power of attorney notary Monrovia",
      "contract notarization Liberia",
      "legal document authentication Monrovia",
      "notary services Liberia",
      "best notary Monrovia"
    ].join(", ")
  },
  "about.html": {
    title: `About Hon. Jefferson Teah | Licensed Notary Public Monrovia, Liberia`,
    description:
      "Meet Hon. Jefferson Teah Notary Public Office — trusted, licensed notaries in Monrovia, Liberia serving individuals, businesses, and institutions with confidential, legally compliant notarial services.",
    keywords: [
      BASE_KEYWORDS,
      "about Jefferson Teah notary",
      "licensed notary public Liberia",
      "experienced notary Monrovia",
      "notary credentials Liberia",
      "trusted notary office Monrovia"
    ].join(", ")
  },
  "service.html": {
    title: `Notary Services Monrovia | Document Notarization & Legal Certification Liberia`,
    description:
      "Full notary services in Monrovia: document notarization, affidavits, certified true copies, deed and contract witnessing, powers of attorney, translations, real estate and corporate document authentication.",
    keywords: [
      BASE_KEYWORDS,
      "notary services Monrovia",
      "document notarization Liberia",
      "affidavit certification Monrovia",
      "certified copies notary Liberia",
      "real estate notary Monrovia",
      "corporate notary Liberia",
      "power of attorney notary Monrovia",
      "commissioner of oaths Liberia"
    ].join(", ")
  },
  "service-details.html": {
    title: `Document Notarization Process | Notary Service Details Monrovia, Liberia`,
    description:
      "How document notarization works at Hon. Jefferson Teah Notary Public Office — required documents, steps, turnaround time, and FAQs for notarial services in Monrovia, Liberia.",
    keywords: [
      BASE_KEYWORDS,
      "document notarization process Liberia",
      "notary requirements Monrovia",
      "documents needed for notary Liberia",
      "notarization steps Monrovia",
      "notary appointment Liberia"
    ].join(", ")
  },
  "request-quote.html": {
    title: `Request Notary Service Online | Monrovia, Liberia | ${SITE}`,
    description:
      "Request notarial service online from Hon. Jefferson Teah Notary Public Office in Monrovia. Submit your document type and details — we respond promptly for notarization, affidavits, and certifications.",
    keywords: [
      BASE_KEYWORDS,
      "request notary service Monrovia",
      "book notary appointment Liberia",
      "notary quote Monrovia",
      "online notary request Liberia",
      "notarization request form Monrovia"
    ].join(", ")
  },
  "verify.html": {
    title: `Verify Notary Document Online | Document ID Check | ${SITE}`,
    description:
      "Verify notarized documents issued by Hon. Jefferson Teah Notary Public Office. Enter your document ID to confirm authenticity and status — official online verification in Monrovia, Liberia.",
    keywords: [
      BASE_KEYWORDS,
      "verify notary document Liberia",
      "document verification Monrovia",
      "notary certificate check online",
      "check notarized document Liberia",
      "Jefferson Teah document verify",
      "notary document ID verification"
    ].join(", ")
  },
  "contact.html": {
    title: `Contact Notary Public Monrovia | ${SITE} — Bassa Community`,
    description:
      "Contact Hon. Jefferson Teah Notary Public Office: +231770388279, info@jeffersonteahnotarypublic.com. Visit us at Bye Pass, Bassa Community, Techno House, Monrovia, Liberia.",
    keywords: [
      BASE_KEYWORDS,
      "contact notary Monrovia",
      "notary phone number Liberia",
      "notary office address Monrovia",
      "notary email Liberia",
      "notary Bassa Community Monrovia"
    ].join(", ")
  },
  "contact-two.html": {
    title: `Contact Us | Notary Office Monrovia, Liberia | ${SITE}`,
    description:
      "Reach Hon. Jefferson Teah Notary Public Office in Monrovia, Liberia. Call, email, visit our Bassa Community office, or send a message online for notarial services.",
    keywords: [
      BASE_KEYWORDS,
      "contact notary Liberia",
      "notary office Monrovia contact",
      "notary WhatsApp Monrovia"
    ].join(", ")
  },
  "faq.html": {
    title: `Notary FAQ | Common Questions About Notarization in Monrovia, Liberia`,
    description:
      "Frequently asked questions about notary services in Monrovia — ID requirements, fees, mobile notary, document types, turnaround times, and legal notarization in Liberia.",
    keywords: [
      BASE_KEYWORDS,
      "notary FAQ Liberia",
      "notarization questions Monrovia",
      "how much does notary cost Liberia",
      "what documents need notary Monrovia",
      "mobile notary Liberia",
      "notary identification requirements Liberia"
    ].join(", ")
  },
  "gallery.html": {
    title: `Gallery | Notary Office Photos | ${SITE} Monrovia`,
    description:
      "Photo gallery of Hon. Jefferson Teah Notary Public Office — office, team, official engagements, and notarial services in Monrovia, Liberia.",
    keywords: [
      BASE_KEYWORDS,
      "notary office photos Monrovia",
      "Jefferson Teah notary gallery",
      "notary public office images Liberia"
    ].join(", ")
  },
  "team-one.html": {
    title: `Our Notaries | Licensed Team | ${SITE} Monrovia, Liberia`,
    description:
      "Meet the licensed notaries and legal officers at Hon. Jefferson Teah Notary Public Office — experienced professionals serving Monrovia and all of Liberia.",
    keywords: [
      BASE_KEYWORDS,
      "notaries Monrovia",
      "Hon Jefferson Teah notary team",
      "licensed notary public Liberia",
      "commissioner of oaths Monrovia"
    ].join(", ")
  },
  "team-two.html": {
    title: `Notary Team List | ${SITE} — Monrovia, Liberia`,
    description:
      "Licensed notaries, commissioners of oaths, and legal officers at Hon. Jefferson Teah Notary Public Office in Monrovia, Liberia.",
    keywords: [
      BASE_KEYWORDS,
      "notary team Liberia",
      "legal officers Monrovia",
      "notary staff Jefferson Teah"
    ].join(", ")
  },
  "testimonial.html": {
    title: `Client Reviews | Notary Testimonials Monrovia, Liberia | ${SITE}`,
    description:
      "Read reviews from clients of Hon. Jefferson Teah Notary Public Office — trusted notarial services for individuals, businesses, and institutions across Liberia.",
    keywords: [
      BASE_KEYWORDS,
      "notary reviews Monrovia",
      "notary testimonials Liberia",
      "best notary public Monrovia reviews"
    ].join(", ")
  },
  "portfolio-slider.html": {
    title: `Notarial Work Examples | ${SITE} Monrovia`,
    description:
      "Examples of notarial case types handled by Hon. Jefferson Teah Notary Public Office — document certification and legal witnessing in Monrovia, Liberia.",
    keywords: [BASE_KEYWORDS, "notary work examples Liberia", "notarial cases Monrovia"].join(", ")
  },
  "portfolio-column-two.html": {
    title: `Our Notarial Work | ${SITE} — Monrovia, Liberia`,
    description:
      "Representative notarial work and document types certified by Hon. Jefferson Teah Notary Public Office in Monrovia, Liberia.",
    keywords: [BASE_KEYWORDS, "notary portfolio Liberia", "document certification examples Monrovia"].join(", ")
  },
  "portfolio-column-three.html": {
    title: `Notary Case Types | ${SITE} Monrovia, Liberia`,
    description:
      "Notarial case types and document certifications handled by Hon. Jefferson Teah Notary Public Office in Monrovia, Liberia.",
    keywords: [BASE_KEYWORDS, "notary case types Liberia", "notarial documents Monrovia"].join(", ")
  },
  "project-details.html": {
    title: `Notary Project Details | ${SITE} Monrovia, Liberia`,
    description:
      "Detailed look at notarial projects and document certification work by Hon. Jefferson Teah Notary Public Office in Monrovia, Liberia.",
    keywords: [BASE_KEYWORDS, "notary project Liberia", "document notarization case study Monrovia"].join(", ")
  },
  "blog-grid-two.html": {
    title: `Notary Blog & Guides | ${SITE} Monrovia, Liberia`,
    description:
      "Guides and articles about notarial services, affidavits, powers of attorney, and document certification in Monrovia, Liberia.",
    keywords: [
      BASE_KEYWORDS,
      "notary blog Liberia",
      "notarization guides Monrovia",
      "legal documents blog Liberia"
    ].join(", ")
  },
  "blog-grid-three.html": {
    title: `Notary Articles | Legal Document Guides | Monrovia, Liberia`,
    description:
      "Educational articles on notary services, document authentication, and legal witnessing in Monrovia, Liberia from Hon. Jefferson Teah Notary Public Office.",
    keywords: [BASE_KEYWORDS, "notary articles Liberia", "affidavit guide Monrovia"].join(", ")
  },
  "blog-standard.html": {
    title: `Notary News & Guides | ${SITE} Monrovia`,
    description:
      "Latest guides and insights on notarial services and legal documentation in Monrovia, Liberia.",
    keywords: [BASE_KEYWORDS, "notary news Liberia", "notarization tips Monrovia"].join(", ")
  },
  "blog-details.html": {
    title: `Notary Article | ${SITE} — Monrovia, Liberia`,
    description:
      "In-depth article on notarial services and legal document requirements in Monrovia, Liberia from Hon. Jefferson Teah Notary Public Office.",
    keywords: [BASE_KEYWORDS, "notary article Liberia", "legal document guide Monrovia"].join(", ")
  },
  "404.html": {
    title: `Page Not Found | ${SITE} — Monrovia, Liberia`,
    description: "The page you requested was not found. Return to Hon. Jefferson Teah Notary Public Office homepage for notary services in Monrovia, Liberia.",
    keywords: [BASE_KEYWORDS, "notary Monrovia homepage"].join(", ")
  }
};

module.exports = { SEO, SITE, LOCATION, BASE_KEYWORDS };
