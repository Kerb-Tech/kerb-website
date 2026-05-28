/* Kerb motion — progressive enhancement, zero dependencies.
   Everything here is additive: with JS off, or reduced-motion on, the site
   renders exactly as before. Nothing about content, fonts or layout changes. */
(function () {
  "use strict";

  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  var canHover =
    window.matchMedia &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ------------------------------------------------------------------ *
   * 0. REVEAL — elements with [data-reveal] fade + settle down into     *
   *    place on load, staggered. The value (ms) is an explicit delay;   *
   *    if omitted, they cascade in source order. Initial hidden state   *
   *    lives in CSS behind the .js class, so JS-off shows them normally.*
   * ------------------------------------------------------------------ */
  var revealEls = [].slice.call(document.querySelectorAll("[data-reveal]"));
  if (revealEls.length) {
    function show(el) {
      var explicit = parseFloat(el.getAttribute("data-reveal"));
      var delay = isNaN(explicit) ? 0 : explicit;
      setTimeout(function () {
        el.classList.add("is-in");
      }, delay);
    }
    if ("IntersectionObserver" in window) {
      // Each element drops into view as it scrolls in (the hero, already on
      // screen at load, fires immediately and cascades via its delays).
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              show(entry.target);
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      revealEls.forEach(function (el) {
        io.observe(el);
      });
    } else {
      revealEls.forEach(function (el) {
        el.classList.add("is-in");
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * 1. PARALLAX — elements with [data-parallax] drift as you scroll.    *
   *    Value is the strength (0.06 = subtle, 0.2 = strong).             *
   * ------------------------------------------------------------------ */
  var parallaxEls = [].slice.call(document.querySelectorAll("[data-parallax]"));

  /* Vertical scroll inside the frame: [data-vscroll] pans an object-fit:cover
     image's crop up/down within its fixed frame as the page scrolls. The value
     is the pan range in %, [data-vscroll-x] keeps a horizontal crop fixed. */
  var vscrollEls = [].slice.call(document.querySelectorAll("[data-vscroll]"));

  /* ------------------------------------------------------------------ *
   * 2. STICKY-STACK polish — cards in .kerb-stack scale + dim slightly  *
   *    as the next card slides up to cover them. The pinning itself is  *
   *    pure CSS (position: sticky); this just adds depth.               *
   * ------------------------------------------------------------------ */
  var stackCards = [].slice.call(
    document.querySelectorAll(".kerb-stack .kerb-stack-card")
  );

  var ticking = false;
  function frame() {
    var vh = window.innerHeight;

    parallaxEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var center = r.top + r.height / 2;
      var progress = (center - vh / 2) / (vh / 2 + r.height / 2); // ~-1..1
      var strength = parseFloat(el.getAttribute("data-parallax")) || 0.1;
      var shift = -progress * strength * 100;
      el.style.transform = "translate3d(0," + shift.toFixed(2) + "px,0)";
    });

    vscrollEls.forEach(function (el) {
      var frame = el.parentNode;
      var fr = frame.getBoundingClientRect();
      var overflow = el.offsetHeight - frame.clientHeight; // extra image height (px)
      if (overflow <= 0) return;
      var p = (vh - fr.top) / (vh + fr.height); // 0 entering bottom .. 1 leaving top
      p = Math.max(0, Math.min(1, p));
      el.style.transform = "translateY(" + (-p * overflow).toFixed(1) + "px)";
    });

    stackCards.forEach(function (c) {
      var r = c.getBoundingClientRect();
      var stickTop = parseFloat(window.getComputedStyle(c).top) || 104;
      var stuck = stickTop - r.top; // > 0 once pinned and being pushed up
      var k = Math.max(0, Math.min(1, stuck / 420));
      c.style.filter = k > 0 ? "brightness(" + (1 - k * 0.22).toFixed(3) + ")" : "";
    });

    ticking = false;
  }
  function requestFrame() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(frame);
    }
  }
  if (parallaxEls.length || vscrollEls.length || stackCards.length) {
    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", requestFrame, { passive: true });
    frame();
  }

  /* ------------------------------------------------------------------ *
   * 3. MAGNETIC — .magnetic elements ease toward the cursor on hover.   *
   *    Pointer devices only; touch devices are left untouched.          *
   * ------------------------------------------------------------------ */
  if (canHover) {
    [].slice.call(document.querySelectorAll(".magnetic")).forEach(function (el) {
      var strength = parseFloat(el.getAttribute("data-magnetic")) || 0.4;
      el.style.transition = "transform 0.18s cubic-bezier(0.2,0.8,0.2,1)";
      el.style.willChange = "transform";
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width / 2);
        var my = e.clientY - (r.top + r.height / 2);
        el.style.transform =
          "translate(" +
          (mx * strength).toFixed(1) +
          "px," +
          (my * strength).toFixed(1) +
          "px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "translate(0,0)";
      });
    });
  }
})();
