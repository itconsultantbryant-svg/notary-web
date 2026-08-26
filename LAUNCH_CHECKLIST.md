# Notary Institution Website — Launch Checklist

Static HTML5 site (Bootstrap 5 + vanilla JS). No build step required.

## 1. Finalize content (replace placeholders)
- [ ] **Phone**: replace `+23177xxxxxxxxx` across ALL pages (top bar, footer, contact pages, request form). It appears in `index.html` and every page's top-bar/footer.
- [ ] **Logo files**: the `.brand-mark` uses a Font Awesome stamp icon. Swap for real light/dark logo PNG/SVG in `assets/img/` if desired.
- [ ] **Photos**: all imagery uses `.img-ph` placeholder blocks (navy gradient + icon). Replace with real photos of the office, notaries, documents, etc.
- [ ] **Fees**: `pricing-plan.html` shows example fees + a "confirm before publishing" note. Replace with verified, legally accurate rates.
- [ ] **Office hours**: shown in `faq.html` and contact pages — confirm actual hours.
- [ ] **Team**: `team-one.html` / `team-two.html` use placeholder names. Add real notary names, titles, credentials, and photos (with permission).
- [ ] **Testimonials**: quotes are sample text. Replace with real, permitted client testimonials.
- [ ] **Business registration / license number**: add to About / footer if you want it displayed for credibility.

## 2. Wire up forms (Formspree)
All forms use `data-form="true"` with `action="https://formspree.io/f/REPLACE_WITH_FORM_ID"`.
- [ ] Create a free form at https://formspree.io and copy your form ID.
- [ ] Replace `REPLACE_WITH_FORM_ID` in every `action="..."` (search the repo) with your real ID.
- Until then, forms show a local "success" message (no email sent) — useful for preview.
- Newsletter forms use `data-newsletter="true"` and are purely front-end (no backend needed).

## 3. Google Maps
- [ ] Contact pages embed `https://www.google.com/maps?q=Bassa+Community+Monrovia+Liberia&output=embed`. For a styled pin, create a Maps API key and use the embed API, or generate a share-embed URL from Google Maps.

## 4. Domain, hosting & SSL
- [ ] Choose hosting (Netlify / Vercel / shared). This is plain static HTML — drag the folder to Netlify or push to GitHub.
- [ ] Point DNS to hosting; install SSL (HTTPS) — Netlify/Vercel do this automatically.
- [ ] Replace `https://www.notary.com` in `sitemap.xml` and `robots.txt` with the real domain.

## 5. SEO & Analytics
- [ ] Submit `sitemap.xml` to Google Search Console.
- [ ] Add Google Analytics (or Plausible) snippet to `<head>` of every page.
- [ ] Verify each page `<title>` and `<meta name="description">` are unique (homepage is done; review secondary pages).
- [ ] Add real Open Graph image `og-image.jpg` (1200×630 PNG) — currently `og-image.svg` is a placeholder.

## 6. Pre-launch QA
- [ ] Open in Chrome / Safari / Firefox / Edge.
- [ ] Test mobile hamburger menu + dropdowns.
- [ ] Test pricing Standard/Express toggle on homepage + `pricing-plan.html`.
- [ ] Test testimonial & portfolio sliders.
- [ ] Click through ALL nav links on every page (no 404s except the intentional 404 page).
- [ ] Compress images (e.g. TinyPNG) before upload.
- [ ] Validate contrast/alt text for accessibility.

## File map
```
index.html                  Homepage (all 13 sections)
about.html                  About Us
service.html                All Services
service-details.html        Single service detail
portfolio-slider.html       Our Work — slider
portfolio-column-two.html   Our Work — 2 col
portfolio-column-three.html Our Work — 3 col
project-details.html        Case detail
team-one.html / team-two.html  Our Notaries (grid / list)
pricing-plan.html           Pricing & fees + schedule
faq.html                    FAQ accordion
testimonial.html            Testimonials grid
blog-grid-two.html / blog-grid-three.html / blog-standard.html / blog-details.html
contact.html / contact-two.html   Contact styles 1 & 2
request-quote.html          Request service form
404.html                    Not found
assets/css/style.css        Design system
assets/js/main.js           Interactions
```
