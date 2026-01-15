import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

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
  }

  connectedCallback() {
    this.initFancyboxOnce();
    window.addEventListener("fc:fancyboxClosed", this._onFancyboxClosed);

    if (window.KeenSlider) {
      this.initializeSlider(window.KeenSlider);
    } else {
      document.addEventListener("custom:KeenLoaded", () => {
        if (window.KeenSlider) this.initializeSlider(window.KeenSlider);
      });
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

      // ✅ free scroll feel in popup
      Carousel: {
        friction: 0.92,
        wheel: "slide",
      },

      Html5video: { autoplay: true },

      on: {
        // Stop videos on close
        closing: (fb) => {
          const root = fb?.container;
          if (!root) return;
          root.querySelectorAll("video").forEach((v) => {
            try {
              v.pause();
              v.currentTime = 0;
              v.removeAttribute("src");
              v.load();
            } catch (_) {}
          });
        },

        // Stop videos when popup slider changes
        "Carousel.change": (fb) => {
          const root = fb?.container;
          if (!root) return;
          root.querySelectorAll("video").forEach((v) => {
            try {
              v.pause();
              v.currentTime = 0;
              v.removeAttribute("src");
              v.load();
            } catch (_) {}
          });
        },

        // ✅ after close, tell page sliders to refresh
        destroy: () => {
          window.dispatchEvent(new Event("fc:fancyboxClosed"));
        },
      },
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

            // ✅ IMPORTANT: overlay links drag-safe (so swipe doesn't open fancybox)
            this.makeFancyboxLinksDragSafe();

            // Keep original video behavior safe (pause on slide change)
            slider.on("slideChanged", () => this.pauseAllVideos());

            // Attach video & popup behavior
            this.attachVideoControls();

            this.updateThumb();
          });
        },

        // ✅ THIS IS THE KEY FIX (copied from your working project)
        FeaturedSlider.wheelControls,
      ]
    );
  }

  /* -------------------------------
     ✅ EXACT wheelControls from your working code
     - converts trackpad deltaX into Keen "drag" events
     - makes laptop left-right swipe work naturally
  ---------------------------------*/
  static wheelControls(slider) {
    var touchTimeout;
    var position;
    var wheelActive;

    function dispatch(e, name) {
      position.x -= e.deltaX;
      position.y -= e.deltaY;
      slider.container.dispatchEvent(
        new CustomEvent(name, {
          detail: {
            x: position.x,
            y: position.y,
          },
        })
      );
    }

    function wheelStart(e) {
      position = {
        x: e.pageX,
        y: e.pageY,
      };
      dispatch(e, "ksDragStart");
    }

    function wheel(e) {
      dispatch(e, "ksDrag");
    }

    function wheelEnd(e) {
      dispatch(e, "ksDragEnd");
    }

    function eventWheel(e) {
      // ✅ same filter as your code:
      // if user is scrolling vertically, allow page scroll
      if (Math.abs(e.deltaY) > 5 && Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;


      e.preventDefault();
      if (!wheelActive) {
        wheelStart(e);
        wheelActive = true;
      }
      wheel(e);

      clearTimeout(touchTimeout);
      touchTimeout = setTimeout(() => {
        wheelActive = false;
        wheelEnd(e);
      }, 50);
    }

    slider.on("created", () => {
      slider.container.addEventListener("wheel", eventWheel, {
        passive: false,
      });
    });

    // ✅ cleanup (safe)
    slider.on("destroyed", () => {
      slider.container.removeEventListener("wheel", eventWheel);
    });
  }

  /* -------------------------------
     AUTO HIDE ARROWS BASED ON SLIDES
  ---------------------------------*/
  setupArrows() {
    const prev = this.querySelector('[data-role="arrow-prev"]');
    const next = this.querySelector('[data-role="arrow-next"]');

    const total = this.slides.length;
    const currentPerView =
      window.innerWidth >= 768
        ? Math.max(1, this.desktopCards)
        : this.mobilePerView;

    // hide/show arrows
    const shouldShow = total > currentPerView;

    if (prev) prev.style.display = shouldShow ? "" : "none";
    if (next) next.style.display = shouldShow ? "" : "none";

    if (!shouldShow) return;

    if (prev) prev.addEventListener("click", () => this.slider.prev());
    if (next) next.addEventListener("click", () => this.slider.next());
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
     AUTO HIDE BOTTOM SCROLL BAR
  ---------------------------------*/
  updateThumb() {
    if (!this.slider || !this.sliderThumb || !this.thumbWrapper) return;

    const totalSlides =
      this.slider.track.details.slides.length || this.slides.length || 1;

    const currentPerView =
      window.innerWidth >= 768 ? Math.max(1, this.desktopCards) : this.mobilePerView;

    // Hide if not enough slides
    if (totalSlides <= currentPerView) {
      this.thumbWrapper.style.display = "none";
      return;
    } else {
      this.thumbWrapper.style.display = "";
    }

    const wrapperWidth = this.thumbWrapper.offsetWidth || 1;
    const thumbPercent = Math.min(100, (currentPerView / totalSlides) * 100);
    const thumbWidthPx = (thumbPercent / 100) * wrapperWidth;

    const progress = Math.max(0, Math.min(1, this.slider.track.details.progress || 0));
    const maxLeftPx = Math.max(0, wrapperWidth - thumbWidthPx);

    const leftPx = progress * maxLeftPx;

    this.sliderThumb.style.width = `${Math.round(thumbWidthPx)}px`;
    this.sliderThumb.style.left = `${Math.round(leftPx)}px`;
  }

  /* -------------------------------
     ✅ overlay <a> should not block swipe
     - swipe = slider move
     - click = fancybox open
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

      // capture click to cancel if it was a swipe
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

    // Keep inline preview readiness
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

    // only one inline video at a time
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
     ✅ Fix: Fancybox close -> sometimes layout overflow
  ---------------------------------*/
  refreshAfterFancybox() {
    try {
      // force reflow
      // eslint-disable-next-line no-unused-expressions
      this.sliderWrapper?.offsetWidth;

      if (this.keenInstance?.update) this.keenInstance.update();
      if (this.slider?.update) this.slider.update();

      this.updateThumb();

      // hard prevent page horizontal scrollbar
      document.documentElement.style.overflowX = "hidden";
      document.body.style.overflowX = "hidden";
    } catch (_) {}
  }

  disconnectedCallback() {
    try {
      if (this.keenInstance?.destroy) this.keenInstance.destroy();
      else if (this.slider?.destroy) this.slider.destroy();
    } catch (_) {}

    window.removeEventListener("resize", this._onResizeUpdateThumb);
    window.removeEventListener("fc:fancyboxClosed", this._onFancyboxClosed);
  }
}

customElements.define("featured-slider", FeaturedSlider);
    