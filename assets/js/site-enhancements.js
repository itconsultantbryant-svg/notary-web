/* Site enhancements: WhatsApp button, verify nav highlight */
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

  /* Highlight active nav */
  var path = window.location.pathname;
  document.querySelectorAll(".navbar-nav .nav-link").forEach(function (link) {
    var href = link.getAttribute("href");
    if (!href || href === "#") return;
    if (path.endsWith(href) || (href === "index.html" && (path === "/" || path.endsWith("/")))) {
      link.classList.add("active");
    }
  });
})();
