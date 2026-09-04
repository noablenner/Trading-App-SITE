/* Curseur bougie — version autonome (sans GSAP) pour les pages qui ne
   chargent pas main.js, ex. le blog. Même rendu que sur la home : suit
   la souris, grossit au survol des éléments cliquables, squash au clic.
   Desktop (pointeur fin) + motion OK uniquement ; sinon curseur natif. */
(function () {
  "use strict";
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (REDUCED || !window.matchMedia("(pointer:fine)").matches) return;

  var el = document.createElement("div");
  el.className = "cursor-candle";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML =
    '<div class="cc-scale"><div class="cc-squash">' +
    '<svg viewBox="0 0 20 40" xmlns="http://www.w3.org/2000/svg">' +
    '<rect class="cc-wick" x="9" y="1" width="2" height="38" rx="1" fill="#34d399"/>' +
    '<rect class="cc-body" x="4" y="11" width="12" height="18" rx="2.5" fill="#34d399" stroke="#8ef2cd" stroke-width="1"/>' +
    "</svg></div></div>";
  document.body.appendChild(el);
  document.documentElement.classList.add("candle-cursor");

  var scaleEl = el.querySelector(".cc-scale");
  var squashEl = el.querySelector(".cc-squash");
  scaleEl.style.transition = "transform .28s cubic-bezier(.16,1,.3,1)";
  squashEl.style.transition = "transform .4s cubic-bezier(.16,1,.3,1)";

  var mx = 0,
    my = 0,
    x = 0,
    y = 0,
    shown = false;

  function loop() {
    x += (mx - x) * 0.35;
    y += (my - y) * 0.35;
    el.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.addEventListener(
    "pointermove",
    function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      mx = e.clientX;
      my = e.clientY;
      if (!shown) {
        shown = true;
        x = mx;
        y = my;
        el.style.opacity = "1";
      }
    },
    { passive: true }
  );
  document.addEventListener("mouseleave", function () {
    el.style.opacity = "0";
  });
  document.addEventListener("mouseenter", function () {
    if (shown) el.style.opacity = "1";
  });

  var HOT = "a,button,.magnetic,.card,.qa button,.seg,.plan,[role=button]";
  document.addEventListener("pointerover", function (e) {
    if (e.target.closest && e.target.closest(HOT)) {
      el.classList.add("is-hot");
      scaleEl.style.transform = "scale(1.55)";
    }
  });
  document.addEventListener("pointerout", function (e) {
    if (e.target.closest && e.target.closest(HOT)) {
      el.classList.remove("is-hot");
      scaleEl.style.transform = "scale(1)";
    }
  });

  window.addEventListener("pointerdown", function () {
    squashEl.style.transitionDuration = ".12s";
    squashEl.style.transform = "scale(1.14, 0.72)";
  });
  window.addEventListener("pointerup", function () {
    squashEl.style.transitionDuration = ".4s";
    squashEl.style.transform = "scale(1, 1)";
  });
})();
