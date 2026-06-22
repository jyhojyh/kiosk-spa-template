(() => {
  "use strict";

  /*
    Kiosk SPA Template (Reusable)
    - Route-based rendering (per page)
    - Generic data-navigate / data-back handling
    - Optional Slide Menu + Idle Timer + GSAP page-enter hooks + Swiper init

    How to use:
      1) Copy this file to your project as js/app.js (or import it)
      2) Edit CONFIG + ROUTES to match your HTML structure
      3) Ensure section ids exist: <section id="page-{id}" class="spa-page">...</section>
  */

  /**
   * =========================
   *  CONFIG (project-specific)
   * =========================
   */
  const CONFIG = {
    // Pages supported by router (must match #page-{id} in HTML)
    pages: ["main", "hub", "company", "process", "products"],

    // SPA transition timings (match css/kiosk.css)
    transitionMs: 300,

    // Slide menu (set enabled=false if you don't use the side menu)
    slideMenu: {
      enabled: true,
      selectors: {
        menu: "#slide-menu",
        backdrop: "#slide-menu-backdrop",
        close: "#slide-menu-close",
        openButtons: ".sn-menu",
        items: ".slide-menu-item[data-page]",
      },
      // When navigating via slide menu, reset history to ["main"] except main
      resetHistoryOnMenuNav: true,
    },

    // Navigation attributes
    nav: {
      navigateAttr: "data-navigate",
      backAttr: "data-back",
    },

    // Touch filtering to avoid scroll->tap accidental navigation
    touch: {
      scrollThresholdPx: 10,
      ignoreGhostClicksFromTouch: true,
    },

    // Idle timer (set enabled=false if not needed)
    idle: {
      enabled: true,
      ms: 60_000,
      warnAtRatio: 0.83,
      barSelector: "#idle-bar",
      // On idle timeout, navigate back to:
      homePageId: "main",
      // Do not run idle timer on these pages
      disabledOn: ["main"],
    },
  };

  /**
   * =====================================
   *  ROUTES (per-page render/init hooks)
   * =====================================
   *
   * - render() is called BEFORE page becomes active (good for DOM injection)
   * - onEnter() is called AFTER page becomes active (good for animations / swiper update)
   */
  const ROUTES = {
    main: {
      onEnter: () => {
        // Example GSAP enter animation for main hero (optional).
        // If you don't use GSAP, delete this block.
        const gsap = window.gsap;
        const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (!gsap || reduce) {
          showMainHeroImmediately();
          return;
        }
        setTimeout(() => playMainHeroAnimation(), 320);
      },
    },

    process: {
      render: () => {
        // Example: Inject slides from PROCESS_STEPS array
        // Customize selectors / HTML template as needed
        const wrapper = document.getElementById("process-swiper-wrapper");
        if (!wrapper) return;
        wrapper.innerHTML = (window.PROCESS_STEPS || []).map((s) => {
          const desc = (s.desc || "")
            .split("\n")
            .map((line) => `<p>${escapeHtml(line)}</p>`)
            .join("");
          return `
            <div class="swiper-slide">
              <div class="sn-process-slide">
                <div class="sn-step-num">${escapeHtml(s.num)}</div>
                <div class="sn-step-title">${escapeHtml(s.title)}</div>
                <div class="sn-step-desc">${desc}</div>
                <div class="sn-badge">${escapeHtml(s.badge || "")}</div>
                <div class="sn-step-photo" style="background-image:url('${escapeAttr(s.img)}')"></div>
              </div>
            </div>
          `;
        }).join("");
      },
      onEnter: () => {
        // Example: init Swiper (optional)
        initSwiperOnce("processSwiper", {
          root: ".sn-process-swiper",
          options: {
            loop: true,
            pagination: { el: ".sn-process-pagination", clickable: true },
            navigation: { nextEl: ".sn-nav-next", prevEl: ".sn-nav-prev" },
          },
        });
      },
    },

    products: {
      render: () => {
        const grid = document.getElementById("products-grid");
        if (!grid) return;
        grid.innerHTML = (window.PRODUCTS || []).map((p) => `
          <div class="sn-product-card">
            <div class="sn-product-img" style="background-image:url('${escapeAttr(p.img)}')"></div>
            <div class="sn-product-name">${escapeHtml(p.name).replace(/\\n/g, "<br>")}</div>
          </div>
        `).join("");
      },
    },
  };

  /**
   * =====================================
   *  Internal state
   * =====================================
   */
  const PAGES = CONFIG.pages.slice();
  let historyStack = [];
  let current = null;
  let isAnimating = false;

  // Swiper instances registry (so you can init only once)
  const swiperStore = Object.create(null);

  // Touch coords for filtering taps vs scroll
  let touchStartX = 0;
  let touchStartY = 0;

  // Idle timer
  const idleBar = document.querySelector(CONFIG.idle.barSelector);
  let idleTimer = null;
  let warnTimer = null;

  /**
   * =====================================
   *  Core SPA routing
   * =====================================
   */
  function getPageEl(pageId) {
    return document.getElementById("page-" + pageId);
  }

  /**
   * SPA page transition.
   * @param pageId target page id
   * @param dir    "left" (forward, default) | "right" (back)
   * @param opts.instant  true → skip slide animation, swap pages immediately.
   *                       Trigger via `data-no-anim` attribute on a [data-navigate] element.
   *                       Useful for in-place state swaps (e.g. an alert variant of the same screen)
   *                       where a slide transition would feel like leaving the current context.
   */
  function navigate(pageId, dir = "left", opts = {}) {
    if (isAnimating) return;
    if (!PAGES.includes(pageId)) return;
    if (pageId === current) return;

    isAnimating = true;

    const fromEl = current ? getPageEl(current) : null;
    const toEl = getPageEl(pageId);
    if (!toEl) {
      isAnimating = false;
      return;
    }

    // render() before activating page (good for DOM injection)
    if (dir === "left") {
      const route = ROUTES[pageId];
      if (route && typeof route.render === "function") route.render();
    }

    toEl.classList.remove("is-active", "is-leaving-left", "is-leaving-right", "is-entering-back");

    if (opts.instant) {
      // No slide animation — swap active state directly.
      // `.spa-page` base rule has `transition: opacity/transform 260ms` so just toggling
      // is-active would still fade+slide. Suppress the transition for this one swap,
      // then restore on the next frame so subsequent navigations animate normally.
      if (fromEl) fromEl.style.transition = "none";
      toEl.style.transition = "none";
      if (fromEl) fromEl.classList.remove("is-active");
      toEl.classList.add("is-active");
      // Force reflow so the class changes commit before transition is restored.
      void toEl.offsetWidth;
      if (fromEl) void fromEl.offsetWidth;
      requestAnimationFrame(() => {
        if (fromEl) fromEl.style.transition = "";
        toEl.style.transition = "";
      });
      isAnimating = false;
    } else {
      if (dir === "right") toEl.classList.add("is-entering-back");
      void toEl.offsetWidth;

      if (fromEl) {
        fromEl.classList.remove("is-active");
        fromEl.classList.add(dir === "left" ? "is-leaving-left" : "is-leaving-right");
      }

      toEl.classList.remove("is-entering-back");
      toEl.classList.add("is-active");

      setTimeout(() => {
        if (fromEl) fromEl.classList.remove("is-leaving-left", "is-leaving-right");
        isAnimating = false;
      }, CONFIG.transitionMs);
    }

    if (dir === "left" && current) historyStack.push(current);
    current = pageId;
    updateMenuActive(pageId);

    // onEnter() after page activation (good for animation/swiper update)
    const route = ROUTES[pageId];
    if (route && typeof route.onEnter === "function") route.onEnter();

    resetIdle();
  }

  function goBack(opts = {}) {
    if (!historyStack.length) return;
    const prev = historyStack.pop();
    navigate(prev, "right", opts);
  }

  /**
   * =====================================
   *  Slide menu
   * =====================================
   */
  function initSlideMenu() {
    if (!CONFIG.slideMenu.enabled) return;
    const sel = CONFIG.slideMenu.selectors;

    const slideMenu = document.querySelector(sel.menu);
    const backdrop = document.querySelector(sel.backdrop);
    const closeBtn = document.querySelector(sel.close);
    const menuBtns = document.querySelectorAll(sel.openButtons);

    if (!slideMenu || !backdrop || !closeBtn) return;

    const openMenu = () => {
      slideMenu.classList.add("is-open");
      backdrop.classList.add("is-open");
    };
    const closeMenu = () => {
      slideMenu.classList.remove("is-open");
      backdrop.classList.remove("is-open");
    };

    menuBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openMenu();
      });
      btn.addEventListener(
        "touchend",
        (e) => {
          e.preventDefault();
          openMenu();
        },
        { passive: false }
      );
    });

    const closeHandler = (e) => {
      e.preventDefault();
      closeMenu();
    };

    closeBtn.addEventListener("click", closeHandler);
    closeBtn.addEventListener("touchend", closeHandler, { passive: false });
    closeBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") closeHandler(e);
    });

    backdrop.addEventListener("click", closeHandler);
    backdrop.addEventListener("touchend", closeHandler, { passive: false });

    document.querySelectorAll(sel.items).forEach((item) => {
      const handler = (e) => {
        e.preventDefault();
        closeMenu();
        const page = item.dataset.page;
        setTimeout(() => {
          navigate(page, "left");
          if (CONFIG.slideMenu.resetHistoryOnMenuNav) {
            historyStack = page === CONFIG.idle.homePageId ? [] : [CONFIG.idle.homePageId];
          }
        }, 80);
      };
      item.addEventListener("click", handler);
      item.addEventListener("touchend", handler, { passive: false });
    });
  }

  function updateMenuActive(pageId) {
    const sel = CONFIG.slideMenu.selectors.items;
    document.querySelectorAll(sel).forEach((item) => {
      item.classList.toggle("active", item.dataset.page === pageId);
    });
  }

  /**
   * =====================================
   *  Navigation events (data-navigate / data-back)
   * =====================================
   */
  function initNavEvents() {
    document.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
      },
      { passive: true }
    );

    const handler = (e) => {
      if (CONFIG.touch.ignoreGhostClicksFromTouch && e.type === "click" && e.sourceCapabilities?.firesTouchEvents) return;

      if (e.type === "touchend" && e.changedTouches) {
        const t = e.changedTouches[0];
        const dx = Math.abs(t.clientX - touchStartX);
        const dy = Math.abs(t.clientY - touchStartY);
        if (dx > CONFIG.touch.scrollThresholdPx || dy > CONFIG.touch.scrollThresholdPx) return;
      }

      const navEl = e.target.closest("[" + CONFIG.nav.navigateAttr + "]");
      if (navEl) {
        e.preventDefault();
        // `data-no-anim` flag on the trigger → skip slide transition (instant swap).
        const instant = navEl.hasAttribute("data-no-anim");
        navigate(navEl.getAttribute(CONFIG.nav.navigateAttr), "left", { instant });
        return;
      }

      const backEl = e.target.closest("[" + CONFIG.nav.backAttr + "]");
      if (backEl) {
        e.preventDefault();
        // `data-no-anim` works on both [data-navigate] and [data-back] triggers.
        const instant = backEl.hasAttribute("data-no-anim");
        goBack({ instant });
        return;
      }

      resetIdle();
    };

    document.addEventListener("touchend", handler, { passive: false });
    document.addEventListener("click", handler);
  }

  /**
   * =====================================
   *  Idle timer (optional)
   * =====================================
   */
  function resetIdle() {
    if (!CONFIG.idle.enabled) return;

    clearTimeout(idleTimer);
    clearTimeout(warnTimer);

    if (idleBar) {
      idleBar.style.transition = "none";
      idleBar.style.transform = "scaleX(1)";
      idleBar.style.opacity = "0";
    }

    if (current === null) return;
    if (CONFIG.idle.disabledOn.includes(current)) return;

    warnTimer = setTimeout(() => {
      if (!idleBar) return;
      idleBar.style.opacity = "1";
      idleBar.style.transition = `transform ${CONFIG.idle.ms * (1 - CONFIG.idle.warnAtRatio)}ms linear`;
      idleBar.style.transform = "scaleX(0)";
    }, CONFIG.idle.ms * CONFIG.idle.warnAtRatio);

    idleTimer = setTimeout(() => {
      historyStack = [];
      navigate(CONFIG.idle.homePageId, "right");
    }, CONFIG.idle.ms);
  }

  /**
   * =====================================
   *  Utilities
   * =====================================
   */
  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replaceAll("\n", "");
  }

  function initSwiperOnce(key, { root, options }) {
    if (swiperStore[key]) return swiperStore[key];
    if (typeof window.Swiper === "undefined") return null;
    const el = document.querySelector(root);
    if (!el) return null;
    swiperStore[key] = new window.Swiper(root, options);
    return swiperStore[key];
  }

  /**
   * =====================================
   *  Optional: Main hero GSAP animation helpers
   * =====================================
   */
  function showMainHeroImmediately() {
    const page = document.getElementById("page-main");
    if (!page) return;
    const els = page.querySelectorAll(".sn-main-kicker, .sn-main-title, .sn-main-desc, .sn-cta");
    els.forEach((el) => {
      el.style.opacity = "1";
      el.style.visibility = "visible";
    });
  }

  function playMainHeroAnimation() {
    const gsap = window.gsap;
    if (!gsap) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const page = document.getElementById("page-main");
    if (!page || !page.classList.contains("is-active")) return;

    const kicker = page.querySelector(".sn-main-kicker");
    const title = page.querySelector(".sn-main-title");
    const desc = page.querySelector(".sn-main-desc");
    const btn = page.querySelector(".sn-cta");
    if (!kicker || !title || !desc || !btn) return;

    gsap.killTweensOf([kicker, title, desc, btn]);
    gsap.set([kicker, title, desc, btn], { clearProps: "all" });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(kicker, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.55 })
      .fromTo(
        title,
        { autoAlpha: 0, y: 14, scale: 1.01, transformOrigin: "50% 50%" },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.75 },
        "-=0.25"
      )
      .fromTo(desc, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.55 }, "-=0.35")
      .fromTo(
        btn,
        { autoAlpha: 0, y: 10, scale: 0.98, transformOrigin: "50% 50%" },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.2)" },
        "-=0.25"
      );
  }

  /**
   * =====================================
   *  INIT
   * =====================================
   */
  document.addEventListener("DOMContentLoaded", () => {
    if (CONFIG.slideMenu.enabled) initSlideMenu();
    initNavEvents();

    // Start page
    navigate(CONFIG.idle.homePageId);

    // Global activity events can also reset idle
    if (CONFIG.idle.enabled) {
      ["touchstart", "touchend", "click", "scroll", "keydown"].forEach((evt) => {
        document.addEventListener(evt, resetIdle, { passive: true, capture: true });
      });
    }
  });
})();

