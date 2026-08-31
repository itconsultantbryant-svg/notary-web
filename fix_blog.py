#!/usr/bin/env python3
"""Replace mock blog data with real blog posts in index.html"""
import sys
import os

def fix_blog_section():
    index_path = "/Users/user/Desktop/websites/Notary_web/index.html"

    with open(index_path, 'r') as f:
        content = f.read()

    # New blog section content
    new_blog = """  <!-- ========== BLOG ========== -->
  <section class="section bg-cream">
    <div class="container">
      <div class="section-heading" data-aos="fade-up">
        <span class="eyebrow">News &amp; Insights</span>
        <h2>Latest From Our Blog</h2>
      </div>
      <div class="row g-4">
        <div class="col-md-6" data-aos="fade-up">
          <div class="blog-card">
            <div class="blog-img"><div class="img-ph" style="padding:0;overflow:hidden;"><img src="assets/img/content/hon-teah-lnp.jpg" alt="Hon. Jefferson Teah with LNP" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;"></div><span class="cat-badge">News</span></div>
            <div class="blog-body">
              <div class="meta"><span><i class="far fa-calendar"></i> Aug 2026</span><span><i class="far fa-user"></i> Notary Team</span></div>
              <h4><a href="blog-details.html">Hon. Jefferson Teah Engages with Liberia National Police on Legal Cooperation</a></h4>
              <p class="text-muted">Hon. Jefferson S. Teah meets with Liberia National Police leadership to discuss legal cooperation, document verification protocols, and strengthening institutional partnerships for enhanced public service.</p>
              <a href="blog-details.html" class="btn-link-arrow">Read more <i class="fas fa-arrow-right"></i></a>
            </div>
          </div>
        </div>
        <div class="col-md-6" data-aos="fade-up" data-aos-delay="100">
          <div class="blog-card">
            <div class="blog-img"><div class="img-ph" style="padding:0;overflow:hidden;"><img src="assets/img/content/hon-teah-lfa.jpg" alt="Hon. Jefferson Teah at Liberia Football Association" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;"></div><span class="cat-badge">News</span></div>
            <div class="blog-body">
              <div class="meta"><span><i class="far fa-calendar"></i> Aug 2026</span><span><i class="far fa-user"></i> Notary Team</span></div>
              <h4><a href="blog-details.html">Hon. Jefferson Teah Visits Liberia Football Association for Legal Advisory</a></h4>
              <p class="text-muted">A courtesy visit to the Liberia Football Association where Hon. Jefferson S. Teah discussed legal frameworks for sports governance, contract notarization for player transfers, and institutional compliance.</p>
              <a href="blog-details.html" class="btn-link-arrow">Read more <i class="fas fa-arrow-right"></i></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>"""

    # Find the blog section
    lines = content.split('\n')
    blog_start = None
    newsletter_idx = None

    for i, line in enumerate(lines):
        if '<!-- ========== BLOG ========== -->' in line and blog_start is None:
            blog_start = i
        if '<!-- ========== NEWSLETTER ========== -->' in line and blog_start is not None:
            newsletter_idx = i
            break

    if blog_start is not None and newsletter_idx is not None:
        # Rebuild the file with the new blog section
        new_lines = lines[:blog_start] + [new_blog] + lines[newsletter_idx:]
        with open(index_path, 'w') as f:
            f.write('\n'.join(new_lines))
        print(f"SUCCESS: Blog section replaced (lines {blog_start}-{newsletter_idx})")
        return True
    else:
        print(f"FAIL: blog_start={blog_start}, newsletter_idx={newsletter_idx}")
        return False

if __name__ == "__main__":
    fix_blog_section()
