/* ==========================================================================
   polish.js - home page only

   Progressive enhancement. With JS off the page still renders and reads the
   same; nothing here changes any wording.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function onScroll(fn) {
    var ticking = false;
    function handler() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        fn();
        ticking = false;
      });
    }
    window.addEventListener("scroll", handler, { passive: true });
    window.addEventListener("resize", handler);
    handler();
  }

  /* ------------------------------------------------------------------
     Headline sits still while the strips ride up behind it. Once they
     overlap it, the type goes light so it reads against the photographs.
     ------------------------------------------------------------------ */

  function initHeroContrast() {
    var column = document.querySelector(".special-column");
    // Measure against the text block, not the whole column: the column's box
    // runs past the buttons and already grazes the first strip at rest, which
    // would flip the type light before you have scrolled at all.
    var text = document.querySelector(".special-content1");
    var rows = [
      document.querySelector(".row-container1"),
      document.querySelector(".row-container2")
    ].filter(Boolean);

    // The outlined button splits too - its label and its ring both read from
    // the same --eco-split custom property.
    var lines = [
      document.querySelector(".special-text1"),
      document.querySelector(".special-text2"),
      document.querySelector(".special-actions .special-button-outline")
    ].filter(Boolean);

    if (!column || !text || !rows.length) return;

    onScroll(function () {
      var stripTop = rows[0].getBoundingClientRect().top;

      // Colour each block only as far as the photographs have reached it, so a
      // half-covered headline is half light rather than flipping all at once.
      lines.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var split = Math.min(Math.max(stripTop - r.top, 0), r.height);
        el.style.setProperty("--eco-split", split.toFixed(1) + "px");
      });

      var t = text.getBoundingClientRect();
      var over = rows.some(function (row) {
        var r = row.getBoundingClientRect();
        return r.top < t.bottom - 12 && r.bottom > t.top + 12;
      });
      column.classList.toggle("is-over-strips", over);
    });
  }

  /* ------------------------------------------------------------------
     Leaves flicked from the cursor, one colour per tab.
     ------------------------------------------------------------------ */

  var LEAF_COLORS = ["#6d8f4e", "#c2a03c", "#8a6a43"]; // green, yellow, brown
  var GRAVITY = 0.17;
  var DRAG = 0.99;

  function throwLeaves(x, y, color) {
    if (reduceMotion) return;

    for (var i = 0; i < 14; i++) {
      spawnLeaf(x, y, color);
    }
  }

  function spawnLeaf(x, y, color) {
    var el = document.createElement("div");
    el.className = "leaf-particle";
    var size = 8 + Math.random() * 7;
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.style.backgroundColor = color;
    document.body.appendChild(el);

    // Fan upward and out, then let gravity take them down the page.
    var angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.7;
    var speed = 2.4 + Math.random() * 3.4;
    var vx = Math.cos(angle) * speed;
    var vy = Math.sin(angle) * speed;
    var px = x;
    var py = y;
    var rot = Math.random() * 360;
    var spin = (Math.random() - 0.5) * 16;
    var peak = 0.55 + Math.random() * 0.25;
    var life = 900 + Math.random() * 600;
    var start = performance.now();

    function step(now) {
      var t = now - start;
      if (t >= life) {
        el.remove();
        return;
      }
      vy += GRAVITY;
      vx *= DRAG;
      px += vx;
      py += vy;
      rot += spin;
      el.style.transform =
        "translate(" + px + "px," + py + "px) rotate(" + rot + "deg)";
      el.style.opacity = peak * (1 - t / life);
      window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------------
     Feature tabs: a dark green panel sweeps across the frame and the new
     photograph is already in place behind it when it clears.
     ------------------------------------------------------------------ */

  var WIPE_MS = 330;
  var WIPE_EASE = "cubic-bezier(0.7, 0, 0.3, 1)";

  function initFeatureTabs() {
    var wrappers = document.querySelectorAll(".features1-wrapper");

    Array.prototype.forEach.call(wrappers, function (wrapper) {
      var menu = wrapper.querySelector(".features1-tabs-menu");
      var frame = wrapper.querySelector(".features1-image-container");
      if (!menu || !frame) return;

      var tabs = Array.prototype.slice.call(menu.children);
      var images = Array.prototype.slice.call(frame.querySelectorAll("img"));
      // The third features1-wrapper on this page is a single-image promo, not
      // a tab set. Only real tab sets get wired, and only they get .eco-tabs,
      // which is what the hover styling hangs off.
      if (tabs.length < 2 || images.length < 2) return;
      wrapper.classList.add("eco-tabs");

      // The original inline onclick cross-fades; the sweep replaces it.
      tabs.forEach(function (tab) {
        tab.removeAttribute("onclick");
      });
      images.forEach(function (img) {
        img.style.transition = "none";
      });

      var wipe = document.createElement("div");
      wipe.className = "feature-wipe";
      frame.appendChild(wipe);

      var current = 0;
      var busy = false;

      function paint(index) {
        images.forEach(function (img, i) {
          img.style.opacity = i === index ? "1" : "0";
        });
        tabs.forEach(function (tab, i) {
          tab.classList.toggle("eco-tab-active", i === index);
          tab.setAttribute("aria-selected", i === index ? "true" : "false");
        });
        current = index;
      }

      function select(index, originX, originY) {
        throwLeaves(originX, originY, LEAF_COLORS[index % LEAF_COLORS.length]);
        if (index === current || busy) return;

        if (reduceMotion) {
          paint(index);
          return;
        }

        busy = true;
        var cover = wipe.animate(
          [{ transform: "translateX(-101%)" }, { transform: "translateX(0)" }],
          { duration: WIPE_MS, easing: WIPE_EASE, fill: "forwards" }
        );

        cover.onfinish = function () {
          paint(index);
          var clear = wipe.animate(
            [{ transform: "translateX(0)" }, { transform: "translateX(101%)" }],
            { duration: WIPE_MS, easing: WIPE_EASE, fill: "forwards" }
          );
          clear.onfinish = function () {
            clear.cancel();
            cover.cancel();
            busy = false;
          };
        };
      }

      tabs.forEach(function (tab, i) {
        tab.setAttribute("role", "button");
        tab.setAttribute("tabindex", "0");

        tab.addEventListener("click", function (e) {
          select(i, e.clientX, e.clientY);
        });

        tab.addEventListener("keydown", function (e) {
          if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
          e.preventDefault();
          var r = tab.getBoundingClientRect();
          select(i, r.left + r.width / 2, r.top + r.height / 2);
        });
      });

      paint(0);
    });
  }

  ready(function () {
    initHeroContrast();
    initFeatureTabs();
  });
})();
