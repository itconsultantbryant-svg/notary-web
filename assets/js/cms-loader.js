/* CMS content loader — applies database content to data-cms elements */
(function () {
  "use strict";

  function getPageSlug() {
    var body = document.body.getAttribute("data-page");
    if (body) return body;
    var path = window.location.pathname.replace(/^\//, "").replace(/\.html$/, "");
    if (!path || path === "index") return "index";
    return path.split("/")[0];
  }

  function applyContent(data) {
    if (data.page) {
      if (data.page.title) document.title = data.page.title;
      var meta = document.querySelector('meta[name="description"]');
      if (meta && data.page.meta_description) meta.setAttribute("content", data.page.meta_description);
      var ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc && data.page.meta_description) ogDesc.setAttribute("content", data.page.meta_description);
      var ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle && data.page.title) ogTitle.setAttribute("content", data.page.title);
    }

    (data.blocks || []).forEach(function (block) {
      document.querySelectorAll('[data-cms="' + block.block_key + '"]').forEach(function (el) {
        if (block.content_type === "html") {
          el.innerHTML = block.content;
        } else {
          el.textContent = block.content;
        }
      });
    });
  }

  var slug = getPageSlug();
  fetch("/api/cms/content/" + slug)
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) { if (data) applyContent(data); })
    .catch(function () { /* static fallback */ });
})();
