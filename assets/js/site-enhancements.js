/* Site enhancements: WhatsApp button, verify nav highlight, visitor analytics */
(function () {
  "use strict";

  var WA_NUMBER = "231770388279";
  var WA_MSG = encodeURIComponent("Hello, I would like to inquire about notarial services at Hon. Jefferson Teah Notary Public Office.");

  /* Floating WhatsApp button */
  var wa = document.createElement("a");
  wa.href = "https://wa.me/" + WA_NUMBER + "?text=" + WA_MSG;
  wa.target = "_blank";
  wa.rel = "noopener noreferrer";
  wa.className = "whatsapp-float";
  wa.setAttribute("aria-label", "Chat on WhatsApp");
  wa.innerHTML = '<i class="fab fa-whatsapp"></i>';
  document.body.appendChild(wa);

  window.NotaryWhatsApp = {
    number: WA_NUMBER,
    url: function (message) {
      return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(message || "Hello, I need assistance from Hon. Jefferson Teah Notary Public Office.");
    }
  };

  /* Highlight active nav */
  var path = window.location.pathname;
  document.querySelectorAll(".navbar-nav .nav-link").forEach(function (link) {
    var href = link.getAttribute("href");
    if (!href || href === "#") return;
    if (path.endsWith(href) || (href === "index.html" && (path === "/" || path.endsWith("/")))) {
      link.classList.add("active");
    }
  });

  /* Visitor analytics */
  var VISITOR_KEY = "notary_visitor_id";
  var visitorId = localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(VISITOR_KEY, visitorId);
  }
  window.NotaryVisitorId = visitorId;

  var pageStart = Date.now();
  var pagePath = window.location.pathname + window.location.search;

  function trackVisit(durationSeconds) {
    var payload = {
      visitor_id: visitorId,
      page_path: pagePath,
      referrer: document.referrer || null,
      duration_seconds: durationSeconds || 0
    };
    var body = JSON.stringify(payload);
    if (durationSeconds && navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/track", new Blob([body], { type: "application/json" }));
      return;
    }
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      keepalive: true
    }).catch(function () {});
  }

  trackVisit(0);

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      var secs = Math.round((Date.now() - pageStart) / 1000);
      if (secs > 2) trackVisit(secs);
    }
  });

  window.addEventListener("pagehide", function () {
    var secs = Math.round((Date.now() - pageStart) / 1000);
    if (secs > 2) trackVisit(secs);
  });
})();
