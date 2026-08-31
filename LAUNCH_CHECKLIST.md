# Notary Institution Website — Launch Checklist

Static HTML5 site + Node.js API (CMS, document verification, admin dashboard).

**Production URL:** https://www.jeffersonteahnotarypublic.com

## 1. Finalize content (replace placeholders)
- [x] **Phone**: +231770388279 / +231886767621 across all pages
- [x] **Logo**: notary_logo.png wired into header + footer
- [ ] **Photos**: some pages still use SVG scene placeholders — replace with real photos
- [x] **Pricing removed** — no pricing page on site
- [ ] **Office hours**: confirm in faq.html and contact pages
- [x] **Team**: real staff names and photos on team pages
- [ ] **Testimonials**: replace sample quotes with real client testimonials
- [ ] **Business registration / license number**: add to About / footer if desired

## 2. Forms & Backend
- [x] **Contact forms** — POST to `/api/contact`, viewable in admin dashboard
- [x] **Document verification** — `/verify` page + admin document management
- [x] **CMS** — edit content at `/admin` → Content (CMS)
- [ ] **Production database** — set `DATABASE_URL` (Neon PostgreSQL) on Vercel
- [ ] **Change admin password** after first login at `/admin`

## 3. Google Maps
- [x] Contact pages embed Google Maps for Bassa Community, Monrovia

## 4. Domain, hosting & SSL
- [ ] Point DNS for `www.jeffersonteahnotarypublic.com` to Vercel
- [x] `sitemap.xml` and `robots.txt` updated with real domain
- [ ] Deploy to Vercel with env vars (see README.md)
- [ ] Run `npm run init-db` once with production DATABASE_URL

## 5. SEO & Analytics
- [x] Sitemap at https://www.jeffersonteahnotarypublic.com/sitemap.xml
- [x] Canonical URLs, JSON-LD, meta tags on all pages
- [ ] Submit sitemap to Google Search Console
- [ ] Add Google Analytics snippet to pages (optional)
- [ ] Add real Open Graph image (1200×630 PNG)

## 6. Pre-launch QA
- [ ] Test document verification with sample IDs
- [ ] Test admin login, add document, edit CMS content
- [ ] Test contact and request forms
- [ ] Test WhatsApp button
- [ ] Cross-browser and mobile testing

## Key URLs
| URL | Purpose |
|-----|---------|
| `/` | Homepage |
| `/verify` | Public document verification |
| `/admin` | Staff admin dashboard |
| `/api/health` | API health check |

## Admin default login (change immediately)
- Email: `admin@jeffersonteahnotarypublic.com`
- Password: `Admin@2026!`
