/* =====================================================================
   Edgio — animations & interactions
   GSAP + ScrollTrigger + Lenis (tous vendorisés en local)
   Objectif : 60 fps, transform/opacity only, fallback reduced-motion.
   ===================================================================== */
(function () {
  "use strict";

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---------- Année footer ---------- */
  const yEl = $("#year");
  if (yEl) yEl.textContent = new Date().getFullYear();

  /* ---------- NAV : état "scrolled" ---------- */
  const nav = $("#nav");
  const onScrollNav = () => {
    if (window.scrollY > 20) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  };
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  /* ---------- Menu mobile ---------- */
  const burger = $("#burger");
  const menu = $("#mobileMenu");
  const toggleMenu = (force) => {
    const open = force != null ? force : !menu.classList.contains("open");
    menu.classList.toggle("open", open);
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
  };
  if (burger) burger.addEventListener("click", () => toggleMenu());
  $$("#mobileMenu a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  /* =====================================================================
     LENIS — scroll fluide (désactivé si reduced-motion)
     ===================================================================== */
  let lenis = null;
  if (!REDUCED && window.Lenis) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });
    document.documentElement.classList.add("lenis");
  }

  /* Ancrages : scroll fluide via Lenis (sinon natif) */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -70 });
      else target.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
    });
  });

  /* =====================================================================
     GSAP setup
     ===================================================================== */
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);

  if (lenis) {
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------------------------------------------------------------------
     HERO — entrée chorégraphiée
     --------------------------------------------------------------------- */
  const heroItems = $$("[data-hero]").sort(
    (a, b) => +a.dataset.hero - +b.dataset.hero
  );
  const heroPhone = $(".hero-stack .hero-phone");
  const floats = $$(".hero-stack .float-shot");

  if (!REDUCED && heroItems.length) {
    gsap.set(heroItems, { opacity: 0, y: 34, filter: "blur(10px)" });
    if (heroPhone) gsap.set(heroPhone, { opacity: 0, y: 40, scale: 0.94 });
    gsap.set(floats, { opacity: 0, y: 22, scale: 0.92 });

    const tl = gsap.timeline({ delay: 0.15, defaults: { ease: "power3.out" } });
    tl.to(heroItems, {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.9,
      stagger: 0.11,
    })
      .to(heroPhone || {}, { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out" }, 0.25)
      .to(floats, { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.14 }, 0.55);
  } else {
    gsap.set(heroItems, { opacity: 1, y: 0, filter: "none" });
  }

  /* ---------------------------------------------------------------------
     Parallaxe légère des blobs aurora au scroll
     --------------------------------------------------------------------- */
  if (!REDUCED) {
    gsap.to(".aurora .b1", { yPercent: 18, ease: "none", scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: true } });
    gsap.to(".aurora .b2", { yPercent: -14, ease: "none", scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: true } });
  }

  /* ---------------------------------------------------------------------
     REVEALS génériques (fondu-flou + montée, en stagger)
     --------------------------------------------------------------------- */
  if (!REDUCED) {
    /* grilles animées en stagger (les enfants sont exclus du reveal générique) */
    const staggered = new Set();
    [".feat-grid", ".seg-grid", ".steps", ".faq-list"].forEach((sel) => {
      $$(sel).forEach((grid) => {
        const kids = $$(".rv", grid);
        if (!kids.length) return;
        kids.forEach((k) => staggered.add(k));
        ScrollTrigger.create({
          trigger: grid,
          start: "top 82%",
          once: true,
          onEnter: () => {
            gsap.to(kids, {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.85,
              ease: "power3.out",
              stagger: 0.09,
            });
          },
        });
      });
    });

    /* reveals génériques (tout le reste) */
    $$(".rv").forEach((el) => {
      if (staggered.has(el)) return;
      gsap.to(el, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });
  } else {
    gsap.set(".rv", { opacity: 1, y: 0, filter: "none" });
  }

  /* ---------------------------------------------------------------------
     STATEMENT — mots en fondu-flou
     --------------------------------------------------------------------- */
  if (!REDUCED) {
    $$(".statement .line").forEach((line) => {
      const txt = line.querySelectorAll("span");
      gsap.from(line, {
        opacity: 0,
        y: 40,
        filter: "blur(12px)",
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: line, start: "top 85%", once: true },
      });
    });
  }

  /* ---------------------------------------------------------------------
     COMPTEURS animés
     --------------------------------------------------------------------- */
  $$("[data-count]").forEach((el) => {
    const end = +el.dataset.count;
    const suffix = el.dataset.suffix || "";
    if (REDUCED) {
      el.textContent = end + suffix;
      return;
    }
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          v: end,
          duration: 1.6,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = Math.round(obj.v) + suffix;
          },
        });
      },
    });
  });

  /* ---------------------------------------------------------------------
     SECTION PINNÉE CINÉMATIQUE — le moment "waouh"
     --------------------------------------------------------------------- */
  const cinePin = $("#cinePin");
  const cinePhone = $("#cinePhone");
  const states = $$(".cine-state");
  const imgs = $$("#cinePhone .phone-screen img");
  const segs = $$("#cineProgress .seg i");

  if (cinePin && cinePhone && states.length === 3) {
    if (REDUCED) {
      states.forEach((s) => gsap.set(s, { opacity: 1, y: 0 }));
    } else {
      gsap.set(states, { opacity: 0, y: 30 });
      gsap.set(states[0], { opacity: 1, y: 0 });
      gsap.set(imgs, { opacity: 0 });
      gsap.set(imgs[0], { opacity: 1 });

      const mm = gsap.matchMedia();

      const build = (rotate) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: cinePin,
            start: "top top",
            end: () => "+=" + window.innerHeight * 3,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
          defaults: { ease: "power2.inOut" },
        });

        /* trajectoire continue du téléphone (3D sur desktop) */
        tl.fromTo(
          cinePhone,
          { rotateY: rotate ? -9 : 0, rotateX: rotate ? 4 : 0, scale: 0.95, y: 24 },
          { rotateY: rotate ? 9 : 0, rotateX: rotate ? -3 : 0, scale: 1, y: -16, duration: 3, ease: "none" },
          0
        );

        /* --- État 0 -> 1 --- */
        tl.to(states[0], { opacity: 0, y: -30, duration: 0.28 }, 0.86);
        tl.to(imgs[0], { opacity: 0, duration: 0.4 }, 0.82);
        tl.fromTo(imgs[1], { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.82);
        tl.fromTo(states[1], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.28 }, 1.02);

        /* --- État 1 -> 2 --- */
        tl.to(states[1], { opacity: 0, y: -30, duration: 0.28 }, 1.86);
        tl.to(imgs[1], { opacity: 0, duration: 0.4 }, 1.82);
        tl.fromTo(imgs[2], { opacity: 0 }, { opacity: 1, duration: 0.4 }, 1.82);
        tl.fromTo(states[2], { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.28 }, 2.02);

        /* barres de progression */
        tl.fromTo(segs[0], { scaleX: 0 }, { scaleX: 1, transformOrigin: "left", duration: 1 }, 0);
        tl.fromTo(segs[1], { scaleX: 0 }, { scaleX: 1, transformOrigin: "left", duration: 1 }, 1);
        tl.fromTo(segs[2], { scaleX: 0 }, { scaleX: 1, transformOrigin: "left", duration: 1 }, 2);

        return tl;
      };

      mm.add("(min-width: 821px)", () => {
        const tl = build(true);
        return () => tl.scrollTrigger && tl.scrollTrigger.kill();
      });
      mm.add("(max-width: 820px)", () => {
        const tl = build(false); // version allégée : pas de rotation 3D
        return () => tl.scrollTrigger && tl.scrollTrigger.kill();
      });
    }
  }

  /* ---------------------------------------------------------------------
     BOUTONS MAGNÉTIQUES
     --------------------------------------------------------------------- */
  if (!REDUCED && window.matchMedia("(pointer:fine)").matches) {
    $$(".magnetic").forEach((btn) => {
      const strength = 0.35;
      btn.addEventListener("mousemove", (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        gsap.to(btn, { x: x * strength, y: y * strength, duration: 0.4, ease: "power3.out" });
      });
      btn.addEventListener("mouseleave", () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" });
      });
    });
  }

  /* ---------------------------------------------------------------------
     CARTES — tilt 3D + spotlight au survol
     --------------------------------------------------------------------- */
  if (!REDUCED && window.matchMedia("(pointer:fine)").matches) {
    $$(".card").forEach((card) => {
      const spot = $(".spot", card);
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        gsap.to(card, {
          rotateY: (px - 0.5) * 7,
          rotateX: (0.5 - py) * 7,
          duration: 0.4,
          ease: "power2.out",
          transformPerspective: 900,
        });
        if (spot) {
          spot.style.setProperty("--mx", px * 100 + "%");
          spot.style.setProperty("--my", py * 100 + "%");
        }
      });
      card.addEventListener("mouseleave", () => {
        gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.6, ease: "power2.out" });
      });
    });
  }

  /* ---------------------------------------------------------------------
     CURSEUR BOUGIE — une chandelle verte (haussière) suit la souris
     Desktop (pointeur fin) + motion OK uniquement ; sinon curseur natif.
     --------------------------------------------------------------------- */
  if (!REDUCED && window.matchMedia("(pointer:fine)").matches) {
    const el = document.createElement("div");
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

    const scaleEl = $(".cc-scale", el);
    const squashEl = $(".cc-squash", el);
    const xTo = gsap.quickTo(el, "x", { duration: 0.12, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.12, ease: "power3" });

    let shown = false;
    window.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType && e.pointerType !== "mouse") return;
        xTo(e.clientX);
        yTo(e.clientY);
        if (!shown) {
          shown = true;
          gsap.to(el, { opacity: 1, duration: 0.25 });
        }
      },
      { passive: true }
    );
    document.addEventListener("mouseleave", () => gsap.to(el, { opacity: 0, duration: 0.2 }));
    document.addEventListener("mouseenter", () => {
      if (shown) gsap.to(el, { opacity: 1, duration: 0.2 });
    });

    /* survol d'un élément cliquable → la bougie grandit */
    const HOT = "a,button,.magnetic,.card,.qa button,.seg,.plan,[role=button]";
    document.addEventListener("pointerover", (e) => {
      if (e.target.closest && e.target.closest(HOT)) {
        el.classList.add("is-hot");
        gsap.to(scaleEl, { scale: 1.55, duration: 0.28, ease: "power3.out" });
      }
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target.closest && e.target.closest(HOT)) {
        el.classList.remove("is-hot");
        gsap.to(scaleEl, { scale: 1, duration: 0.28, ease: "power3.out" });
      }
    });

    /* clic → petit « squash » de bougie */
    window.addEventListener("pointerdown", () =>
      gsap.to(squashEl, { scaleY: 0.72, scaleX: 1.14, duration: 0.12, ease: "power2.out" })
    );
    window.addEventListener("pointerup", () =>
      gsap.to(squashEl, { scaleY: 1, scaleX: 1, duration: 0.4, ease: "elastic.out(1,0.5)" })
    );
  }

  /* ---------------------------------------------------------------------
     FAQ — accordéon
     --------------------------------------------------------------------- */
  $$(".qa").forEach((qa) => {
    const btn = $("button", qa);
    const ans = $(".ans", qa);
    btn.addEventListener("click", () => {
      const isOpen = qa.classList.contains("open");
      $$(".qa.open").forEach((o) => {
        if (o !== qa) {
          o.classList.remove("open");
          $(".ans", o).style.maxHeight = null;
          $("button", o).setAttribute("aria-expanded", "false");
        }
      });
      qa.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
      ans.style.maxHeight = !isOpen ? ans.scrollHeight + "px" : null;
    });
  });

  /* ---------------------------------------------------------------------
     Refresh ScrollTrigger après chargement complet (images, polices)
     --------------------------------------------------------------------- */
  window.addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
})();
