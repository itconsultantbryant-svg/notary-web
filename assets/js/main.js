/* ============================================================
   NOTARY INSTITUTION — main.js
   Interactions: sticky header, mobile submenu, Swiper sliders,
   AOS, counters, pricing toggle, forms (Formspree-ready).
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Sticky header ---------- */
  var headerMain = document.querySelector(".header-main");
  var topBar = document.querySelector(".top-bar");
  function onScroll() {
    if (!headerMain) return;
    var threshold = topBar ? topBar.offsetHeight : 60;
    if (window.scrollY > threshold) {
      headerMain.classList.add("sticky");
      document.body.style.paddingTop = headerMain.offsetHeight + "px";
    } else {
      headerMain.classList.remove("sticky");
      document.body.style.paddingTop = "0px";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile dropdown (tap to open submenu) ---------- */
  var dropdownToggles = document.querySelectorAll(".navbar .dropdown-toggle");
  dropdownToggles.forEach(function (toggle) {
    toggle.addEventListener("click", function (e) {
      if (window.innerWidth < 992) {
        e.preventDefault();
        var parent = toggle.closest(".dropdown");
        var menu = parent.querySelector(".dropdown-menu");
        var isOpen = menu.classList.contains("show");
        // close others
        document.querySelectorAll(".navbar .dropdown-menu.show").forEach(function (m) {
          if (m !== menu) m.classList.remove("show");
        });
        menu.classList.toggle("show", !isOpen);
      }
    });
  });

  /* ---------- AOS ---------- */
  if (window.AOS) {
    AOS.init({ duration: 800, once: true, offset: 80, easing: "ease-out-cubic" });
  } else {
    // AOS failed to load — reveal all animated content so nothing stays hidden
    document.documentElement.classList.add("no-aos");
  }

  /* ---------- Swiper: testimonials ---------- */
  if (window.Swiper) {
    var testi = document.querySelectorAll(".testi-slider");
    testi.forEach(function (el) {
      new Swiper(el, {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        autoplay: { delay: 5000, disableOnInteraction: false },
        pagination: { el: el.querySelector(".swiper-pagination"), clickable: true },
        breakpoints: { 768: { slidesPerView: 2 }, 992: { slidesPerView: 3 } }
      });
    });

    var portSliders = document.querySelectorAll(".portfolio-slider-init");
    portSliders.forEach(function (el) {
      new Swiper(el, {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        navigation: {
          nextEl: el.querySelector(".swiper-button-next"),
          prevEl: el.querySelector(".swiper-button-prev")
        },
        pagination: { el: el.querySelector(".swiper-pagination"), clickable: true },
        breakpoints: { 768: { slidesPerView: 2 }, 992: { slidesPerView: 3 } }
      });
    });

    // Hero slider (index.html)
    var heroSliders = document.querySelectorAll(".hero-slider");
    heroSliders.forEach(function (el) {
      new Swiper(el, {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: true,
        autoplay: { delay: 6000, disableOnInteraction: false },
        pagination: { el: el.querySelector(".swiper-pagination"), clickable: true },
        navigation: {
          nextEl: el.querySelector(".swiper-button-next"),
          prevEl: el.querySelector(".swiper-button-prev")
        }
      });
    });

    // About slider (about.html)
    var aboutSliders = document.querySelectorAll(".about-slider");
    aboutSliders.forEach(function (el) {
      new Swiper(el, {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: true,
        autoplay: { delay: 5000, disableOnInteraction: false },
        pagination: { el: el.querySelector(".swiper-pagination"), clickable: true },
        navigation: {
          nextEl: el.querySelector(".swiper-button-next"),
          prevEl: el.querySelector(".swiper-button-prev")
        }
      });
    });
  }

  /* ---------- Counters ---------- */
  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-target"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var prefix = el.getAttribute("data-prefix") || "";
    var duration = 1800;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = prefix + Math.floor(ease * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target + suffix;
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll(".counter-number");
  if ("IntersectionObserver" in window && counters.length) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCounter(en.target); cObs.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { cObs.observe(c); });
  } else {
    counters.forEach(function (c) { animateCounter(c); });
  }

  /* ---------- Pricing toggle (Standard / Express) ---------- */
  var pricingSwitch = document.getElementById("pricingToggle");
  if (pricingSwitch) {
    var priceVals = document.querySelectorAll(".price-val");
    pricingSwitch.addEventListener("change", function () {
      var express = pricingSwitch.checked;
      priceVals.forEach(function (p) {
        p.textContent = express ? p.getAttribute("data-express") : p.getAttribute("data-standard");
      });
      document.querySelectorAll(".toggle-label").forEach(function (l) {
        l.classList.toggle("active", (l.dataset.mode === "express") === express);
      });
    });
    // init labels
    document.querySelectorAll(".toggle-label").forEach(function (l) {
      if (l.dataset.mode === "standard") l.classList.add("active");
    });
  }

  /* ---------- Forms (Formspree-ready) ---------- */
  var forms = document.querySelectorAll("form[data-form]");
  forms.forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var action = form.getAttribute("action");
      var submitBtn = form.querySelector('button[type="submit"]');
      var origText = submitBtn ? submitBtn.innerHTML : "";
      var msgBox = form.parentElement.querySelector(".form-msg") ||
                   (form.nextElementSibling && form.nextElementSibling.classList.contains("form-msg") ? form.nextElementSibling : null);

      // Build status node if missing
      if (!msgBox) {
        msgBox = document.createElement("div");
        msgBox.className = "form-msg alert mt-3";
        form.after(msgBox);
      }

      function showSuccess() {
        msgBox.className = "form-msg alert alert-success mt-3";
        msgBox.innerHTML = '<i class="fas fa-check-circle me-2"></i> Thank you. Your request has been received — our office will contact you shortly. For more details Contact our Custormer Service by clicking on the WhatsApp butten';
        form.reset();
        if (submitBtn) submitBtn.disabled = false, (submitBtn.innerHTML = origText);
      }
      function showError() {
        msgBox.className = "form-msg alert alert-danger mt-3";
        msgBox.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i> Something went wrong. Please try again or email us at info@jeffersonteahnotarypublic.com.';
        if (submitBtn) submitBtn.disabled = false, (submitBtn.innerHTML = origText);
      }

      if (!form.checkValidity()) { form.reportValidity(); return; }

      if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Sending…'; }

      // If a real Formspree/endpoint is configured, POST; otherwise simulate.
      if (action && action.indexOf("REPLACE_WITH") === -1) {
        var data = new FormData(form);
        fetch(action, {
          method: "POST",
          body: data,
          headers: { Accept: "application/json" }
        })
          .then(function (r) { return r.ok ? showSuccess() : showError(); })
          .catch(showError);
      } else {
        // Local preview / not yet configured
        setTimeout(showSuccess, 700);
      }
    });
  });

  /* ---------- Newsletter ---------- */
  var newsForms = document.querySelectorAll("form[data-newsletter]");
  newsForms.forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var btn = form.querySelector("button");
      var parent = form.closest(".newsletter-bar, .footer");
      var note = parent ? parent.querySelector(".news-note") : null;
      if (input && !input.value) return;
      if (btn) btn.disabled = true;
      setTimeout(function () {
        if (!note) {
          note = document.createElement("div");
          note.className = "news-note mt-2";
          note.style.color = "#e0c068";
          note.style.fontSize = "0.9rem";
          form.after(note);
        }
        note.textContent = "Subscribed! You'll receive our legal & notarial insights.";
        if (input) input.value = "";
        if (btn) btn.disabled = false;
      }, 600);
    });
  });

  /* ---------- Smooth scroll for in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length > 1) {
        var target = document.querySelector(id);
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth" }); }
      }
    });
  });
})();
