import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

/* -------------------------------
  ✅ Global helpers
---------------------------------*/
function fcStopAndResetVideos(root) {
  if (!root) return;
  root.querySelectorAll("video").forEach((v) => {
    try {
      v.pause();
      v.currentTime = 0;
      v.removeAttribute("src");
      v.load();
    } catch (_) {}
  });
}

function fcUnlockScroll() {
  // Fancybox sometimes leaves these behind
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  document.documentElement.style.paddingRight = "";
  document.body.style.paddingRight = "";
  document.body.classList.remove("compensate-for-scrollbar");

  // avoid accidental horizontal scrollbars
  document.documentElement.style.overflowX = "hidden";
  document.body.style.overflowX = "hidden";
}

function fcDispatchClosed() {
  window.dispatchEvent(new Event("fc:fancyboxClosed"));
}

class FeaturedSlider extends HTMLElement {
  constructor() {
    super();
    this.sliderWrapper = this.querySelector('[data-role="slider-wrapper"]');
    this.thumbWrapper = this.querySelector('[data-role="thumb-wrapper"]');
    this.sliderThumb = this.querySelector('[data-role="thumb"]');

    // attributes
    this.desktopCards = parseInt(this.dataset.desktopCards) || 3;
    this.mobilePerView = parseFloat(this.dataset.mobilePerview) || 1.2;

    // fancybox group (unique per section)
    this.fancyboxGroup = this.dataset.fancyboxGroup || "fc";

    // store refs
    this.slides = [];
    this.slider = null;
    this.keenInstance = null;

    // binders
    this._onResizeUpdateThumb = () => this.updateThumb();
    this._onFancyboxClosed = () => this.refreshAfterFancybox();

    // wheel accumulators
    this._wheelAccum = 0;
    this._wheelTimer = null;
  }

  connectedCallback() {
    this.initFancyboxOnce();
    window.addEventListener("fc:fancyboxClosed", this._onFancyboxClosed);

    if (window.KeenSlider) {
      this.initializeSlider(window.KeenSlider);
    } else {
      document.addEventListener(
        "custom:KeenLoaded",
        () => {
          if (window.KeenSlider) this.initializeSlider(window.KeenSlider);
        },
        { once: true }
      );
    }
  }

  /* -------------------------------
     FANCYBOX (bind once globally)
  ---------------------------------*/
  initFancyboxOnce() {
    if (window.__fcFancyboxBound) return;
    window.__fcFancyboxBound = true;

    Fancybox.bind("[data-fancybox]", {
      animated: true,
      dragToClose: true,
      closeButton: "top",

      // keep popup slider smooth
      Carousel: {
        friction: 0.92,
        wheel: "slide",
      },

      Html5video: { autoplay: true },

      on: {
        // Stop videos on close start
        closing: (fb) => {
          fcStopAndResetVideos(fb?.container);
        },

        // Stop videos when popup slider changes
        "Carousel.change": (fb) => {
          fcStopAndResetVideos(fb?.container);
        },

        // ✅ safest: when Fancybox is DONE closing
        done: () => {
          // in some versions done fires on open too; harmless
        },

        // ✅ close event (best moment to cleanup + refresh)
        close: () => {
          fcUnlockScroll();
          fcDispatchClosed();
        },

        // ✅ destroy as extra safety
        destroy: () => {
          fcUnlockScroll();
          fcDispatchClosed();
        },
      },
    });

    // ✅ ESC should always close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        try {
          Fancybox.close();
        } catch (_) {}
      }
    });
  }

  initializeSlider(KeenSliderClass) {
    if (!this.sliderWrapper) return;

    // collect slides
    this.slides = Array.from(
      this.sliderWrapper.querySelectorAll(".keen-slider__slide")
    );

    // compute perView
    const perViewMobile = this.mobilePerView;
    const perViewDesktop = Math.max(1, this.desktopCards);

    // spacing
    const spacingMobile = 16;
    const spacingDesktop = 32;

    this.keenInstance = new KeenSliderClass(
      this.sliderWrapper,
      {
        loop: false,
        rubberband: false,
        mode: "free",
        drag: true,
        slides: {
          perView: perViewMobile,
          spacing: spacingMobile,
          origin: "auto",
        },
        breakpoints: {
          "(min-width: 768px)": {
            slides: {
              perView: perViewDesktop,
              spacing: spacingDesktop,
              origin: "auto",
            },
          },
        },
      },
      [
        (slider) => {
          slider.on("created", () => {
            this.slider = slider;

            this.setupArrows();
            this.setupThumbSync(slider);

            // ✅ IMPORTANT: overlay links drag-safe
            this.makeFancyboxLinksDragSafe();

            // pause on slide change
            slider.on("slideChanged", () => this.pauseAllVideos());

            // Attach video & popup behavior
            this.attachVideoControls();

            this.updateThumb();
          });
        },

        // ✅ UPDATED wheelControls: ONLY horizontal deltaX (no vertical)
        FeaturedSlider.wheelControlsOnlyHorizontal,
      ]
    );
ڍ;
  }

  /* -------------------------------
     ✅ Wheel Controls (ONLY deltaX)
     - Vertical scroll should NEVER move slider
     - Trackpad left-right works
  ---------------------------------*/
  static wheelControlsOnlyHorizontal(slider) {
    let touchTimeout;
    let position;
    let wheelActive = false;

    function dispatch(e, name) {
      position.x -= e.deltaX;
      // IMPORTANT: do NOT use deltaY at all
      slider.container.dispatchEvent(
        new CustomEvent(name, {
          detail: { x: position.x, y: position.y },
        })
      );
    }

    function wheelStart(e) {
      position = { x: e.pageX, y: e.pageY };
      dispatch(e, "ksDragStart");
    }

    function wheelMove(e) {
      dispatch(e, "ksDrag");
    }

    function wheelEnd(e) {
      dispatch(e, "ksDragEnd");
    }

    function eventWheel(e) {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      // ✅ allow normal page vertical scroll always
      // only trigger when it is truly horizontal gesture
      if (absX < 2 || absX <= absY) return;

      e.preventDefault();

      if (!wheelActive) {
        wheelStart(e);
        wheelActive = true;
      }

      wheelMove(e);

      clearTimeout(touchTimeout);
      touchTimeout = setTimeout(() => {
        wheelActive = false;
        wheelEnd(e);
      }, 50);
    }

    slider.on("created", () => {
      slider.container.addEventListener("wheel", eventWheel, { passive: false });
    });

    slider.on("destroyed", () => {
      slider.container.removeEventListener("wheel", eventWheel);
    });
  }

  /* -------------------------------
     ARROWS
  ---------------------------------*/
  setupArrows() {
    const prev = this.querySelector('[data-role="arrow-prev"]');
    const next = this.querySelector('[data-role="arrow-next"]');

    const total = this.slides.length;
    const currentPerView =
      window.innerWidth >= 768
        ? Math.max(1, this.desktopCards)
        : this.mobilePerView;

    const shouldShow = total > currentPerView;

    if (prev) prev.style.display = shouldShow ? "" : "none";
    if (next) next.style.display = shouldShow ? "" : "none";
    if (!shouldShow) return;

    if (prev) prev.addEventListener("click", () => this.slider?.prev());
    if (next) next.addEventListener("click", () => this.slider?.next());
  }

  setupThumbSync(slider) {
    if (!this.thumbWrapper || !this.sliderThumb) return;

    const update = () => this.updateThumb();

    slider.on("detailsChanged", update);
    window.addEventListener("resize", this._onResizeUpdateThumb);

    const observer = new MutationObserver(update);
    observer.observe(this.sliderWrapper, { childList: true, subtree: true });
  }

  /* -------------------------------
     THUMB
  ---------------------------------*/
  updateThumb() {
    if (!this.slider || !this.sliderThumb || !this.thumbWrapper) return;

    const totalSlides =
      this.slider.track.details.slides.length || this.slides.length || 1;

    const currentPerView =
      window.innerWidth >= 768
        ? Math.max(1, this.desktopCards)
        : this.mobilePerView;

    if (totalSlides <= currentPerView) {
      this.thumbWrapper.style.display = "none";
      return;
    }
    this.thumbWrapper.style.display = "";

    const wrapperWidth = this.thumbWrapper.offsetWidth || 1;
    const thumbWidthPx = (currentPerView / totalSlides) * wrapperWidth;

    const progress = Math.max(
      0,
      Math.min(1, this.slider.track.details.progress || 0)
    );
    const maxLeftPx = Math.max(0, wrapperWidth - thumbWidthPx);

    this.sliderThumb.style.width = `${Math.round(thumbWidthPx)}px`;
    this.sliderThumb.style.left = `${Math.round(progress * maxLeftPx)}px`;
  }

  /* -------------------------------
     ✅ overlay <a> should not block swipe
  ---------------------------------*/
  makeFancyboxLinksDragSafe() {
    const links = Array.from(this.querySelectorAll(".fc-fancybox-link"));
    links.forEach((link) => {
      let startX = 0;
      let startY = 0;
      let moved = false;
      const THRESHOLD = 8;

      link.addEventListener(
        "pointerdown",
        (e) => {
          moved = false;
          startX = e.clientX;
          startY = e.clientY;
        },
        { passive: true }
      );

      link.addEventListener(
        "pointermove",
        (e) => {
          const dx = Math.abs(e.clientX - startX);
          const dy = Math.abs(e.clientY - startY);
          if (dx > THRESHOLD || dy > THRESHOLD) moved = true;
        },
        { passive: true }
      );

      link.addEventListener(
        "click",
        (e) => {
          if (moved) {
            e.preventDefault();
            e.stopPropagation();
          }
        },
        true
      );
    });
  }

  /* -------------------------------
     VIDEO CONTROLS (popup open)
  ---------------------------------*/
  attachVideoControls() {
    const videos = Array.from(this.querySelectorAll("video"));

    videos.forEach((v) => {
      const src = v.dataset.videoSrc;
      if (src && !v.querySelector("source")) {
        v.src = src;
        v.preload = "metadata";
        v.controls = false;
        try {
          v.pause();
        } catch (_) {}
      }
    });

    const playButtons = Array.from(this.querySelectorAll(".fc-video-play"));
    playButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const slideEl = btn.closest(".keen-slider__slide");
        if (!slideEl) return;

        this.pauseAllVideos();

        const link = slideEl.querySelector('.fc-fancybox-link[data-fancybox]');
        if (link) link.click();
      });
    });

    videos.forEach((v) => {
      v.addEventListener("play", () => this.pauseAllVideos(v));
      v.addEventListener("pause", () => {
        const slideEl = v.closest(".keen-slider__slide");
        if (!slideEl) return;
        const btn = slideEl.querySelector(".fc-video-play");
        if (btn) btn.style.display = "";
      });
    });
  }

  pauseAllVideos(except = null) {
    const videos = Array.from(this.querySelectorAll("video"));
    videos.forEach((v) => {
      if (except && v === except) return;
      try {
        v.pause();
        v.controls = false;
      } catch (_) {}

      const slideEl = v.closest(".keen-slider__slide");
      if (slideEl) {
        const btn = slideEl.querySelector(".fc-video-play");
        if (btn) btn.style.display = "";
      }
    });
  }

  /* -------------------------------
     ✅ Fix: Fancybox close -> right gap
     - unlock scroll
     - update slider in multiple frames (after layout settles)
  ---------------------------------*/
  refreshAfterFancybox() {
    try {
      fcUnlockScroll();

      // force reflow
      // eslint-disable-next-line no-unused-expressions
      this.sliderWrapper?.offsetWidth;

      // 🔥 Do update multiple times to catch scrollbar/padding changes
      const run = () => {
        try {
          this.keenInstance?.update?.();
          this.slider?.update?.();
          this.updateThumb();
        } catch (_) {}
      };

      run();
      requestAnimationFrame(run);
      setTimeout(run, 60);

      // hard prevent horizontal overflow
      document.documentElement.style.overflowX = "hidden";
      document.body.style.overflowX = "hidden";
    } catch (_) {}
  }

  disconnectedCallback() {
    try {
      this.keenInstance?.destroy?.();
      this.slider?.destroy?.();
    } catch (_) {}

    window.removeEventListener("resize", this._onResizeUpdateThumb);
    window.removeEventListener("fc:fancyboxClosed", this._onFancyboxClosed);
  }
}

customElements.define("featured-slider", FeaturedSlider);
  