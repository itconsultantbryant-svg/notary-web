# Hon. Jefferson Teah Notary Public Office — Website

Official website for **Hon. Jefferson Teah Notary Public Office**, Monrovia, Liberia.

**Live URL:** [www.jeffersonteahnotarypublic.com](https://www.jeffersonteahnotarypublic.com)

## Features

- **Static marketing site** — 22+ pages (services, team, gallery, blog, contact)
- **Document verification** — Public `/verify` page; users enter a document ID to check authenticity
- **Admin dashboard** — `/admin` for staff login, document management, and CMS
- **CMS** — Edit homepage and key page content in real time from the admin panel
- **Contact forms** — Submissions stored in the database and viewable in admin
- **WhatsApp** — Floating chat button on all pages
- **SEO** — Sitemap, robots.txt, canonical URLs, JSON-LD structured data

## Quick Start (Local)

```bash
npm install
npm run init-db
npm start
```

- Website: http://localhost:3000
- Admin: http://localhost:3000/admin
- Verify: http://localhost:3000/verify

### Default admin login

- **Email:** `admin@jeffersonteahnotarypublic.com`
- **Password:** `Admin@2026!` (change immediately after first login)

Set custom credentials in `.env` (copy from `.env.example`) before running `init-db`.

### Test document IDs

- `JTNP-2026-DOC001`
- `JTNP-2026-DOC002`

## Production Deployment (Vercel + Neon PostgreSQL)

1. Create a [Neon](https://neon.tech) PostgreSQL database
2. Copy `.env.example` to `.env` and set:
   - `DATABASE_URL` — Neon connection string
   - `JWT_SECRET` — long random string
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD`
   - `SITE_URL=https://www.jeffersonteahnotarypublic.com`
3. Deploy to Vercel and add the same env vars in the Vercel dashboard
4. Run `npm run init-db` once (locally with production DATABASE_URL) to create tables and admin user
5. Point DNS for `www.jeffersonteahnotarypublic.com` to Vercel
6. Submit sitemap in [Google Search Console](https://search.google.com/search-console):
   `https://www.jeffersonteahnotarypublic.com/sitemap.xml`

> **Note:** Local dev uses SQLite (`data/notary.db`). Production on Vercel requires `DATABASE_URL` (Neon) because serverless has no persistent filesystem.

## Admin Dashboard

| Section | Purpose |
|---------|---------|
| Dashboard | Stats overview |
| Documents | Add/edit/delete verifiable documents, upload files |
| Content (CMS) | Edit page titles, meta descriptions, and content blocks |
| Submissions | View contact and request form messages |
| Settings | Change password |

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/documents/verify/:id` | No | Public document verification |
| POST | `/api/contact` | No | Contact / request forms |
| GET | `/api/cms/content/:slug` | No | CMS content for a page |
| POST | `/api/auth/login` | No | Admin login |
| GET | `/api/documents` | Yes | List all documents |
| POST | `/api/documents` | Yes | Create document |
| PUT | `/api/cms/admin/blocks/:slug/:key` | Yes | Update CMS block |

## SEO Keywords

The site is optimized for: notary Monrovia, notary Liberia, document notarization, affidavit Liberia, certified true copies, power of attorney Liberia, Hon Jefferson Teah notary, notary public Monrovia, document verification Liberia.

## File Structure

```
index.html, about.html, ...   Public pages
verify.html                   Document verification
admin/                        Admin dashboard
server/                       Express API
api/index.js                  Vercel serverless entry
scripts/init-db.js            Database setup + seed
assets/css/style.css          Styles
assets/js/main.js             Site interactions
assets/js/cms-loader.js       CMS content injection
data/notary.db                Local SQLite database (dev only)
uploads/documents/            Uploaded document files (local)
```
