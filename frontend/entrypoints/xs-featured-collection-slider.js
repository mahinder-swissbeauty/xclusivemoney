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
  }

  connectedCallback() {
    this.initFancyboxOnce();

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

      // Ensure html5 video autoplay inside popup
      Html5video: {
        autoplay: true,
      },

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
      },
    });
  }

  initializeSlider(KeenSliderClass) {
    if (!this.sliderWrapper) return;

    // collect slides
    this.slides = Array.from(this.sliderWrapper.querySelectorAll(".keen-slider__slide"));

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
              rubberband: false,
              mode: "free",
              drag: true,
            },
          },
        },
      },
      [
        (slider) => {
          slider.on("created", () => {
            this.slider = slider;
            this.setupArrows();
            this.wheelControls(slider);
            this.setupThumbSync(slider);

            // Keep original video behavior safe (pause on slide change)
            slider.on("slideChanged", () => this.pauseAllVideos());

            // Attach video & popup behavior
            this.attachVideoControls();

            this.updateThumb();
          });
        },
      ]
    );
  }

  /* -------------------------------
     AUTO HIDE ARROWS BASED ON SLIDES
  ---------------------------------*/
  setupArrows() {
    const prev = this.querySelector('[data-role="arrow-prev"]');
    const next = this.querySelector('[data-role="arrow-next"]');

    const total = this.slides.length;
    const currentPerView =
      window.innerWidth >= 768 ? Math.max(1, this.desktopCards) : this.mobilePerView;

    // hide/show arrows
    const shouldShow = total > currentPerView;

    if (prev) prev.style.display = shouldShow ? "" : "none";
    if (next) next.style.display = shouldShow ? "" : "none";

    if (!shouldShow) return;

    if (prev) prev.addEventListener("click", () => this.slider.prev());
    if (next) next.addEventListener("click", () => this.slider.next());
  }

  wheelControls(slider) {
    let timeout;
    let wheelActive = false;

    function onWheel(e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) return;

      e.preventDefault();
      const movement = e.deltaY || e.deltaX;

      if (!wheelActive) {
        slider.track.stopped = false;
        slider.track.animating = false;
        wheelActive = true;
      }

      slider.track.addMovement(-movement);

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        wheelActive = false;
      }, 80);
    }

    slider.on("created", () => {
      slider.container.addEventListener("wheel", onWheel, { passive: false });
    });
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

    const totalSlides = this.slider.track.details.slides.length || this.slides.length || 1;
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
     VIDEO CONTROLS (updated: popup open)
     - existing inline video load remains safe
     - play button opens Fancybox popup (mp4)
  ---------------------------------*/
  attachVideoControls() {
    const videos = Array.from(this.querySelectorAll("video"));

    // Keep current behavior: attach src for inline poster preview readiness
    videos.forEach((v) => {
      const src = v.dataset.videoSrc;
      if (src && !v.querySelector("source")) {
        v.src = src;
        v.preload = "metadata";
        v.controls = false;
        try { v.pause(); } catch (_) {}
      }
    });

    const playButtons = Array.from(this.querySelectorAll(".fc-video-play"));

    playButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const slideEl = btn.closest(".keen-slider__slide");
        if (!slideEl) return;

        // Pause any inline videos (existing behavior safety)
        this.pauseAllVideos();

        // Open Fancybox for this slide video
        const link = slideEl.querySelector('.fc-fancybox-link[data-fancybox]');
        if (link) {
          link.click();
          return;
        }

        // fallback: old inline play (shouldn't happen)
        const video = slideEl.querySelector("video");
        if (!video) return;

        if (video.paused) {
          video.play().catch(() => {});
          video.controls = true;
          btn.style.display = "none";

          video.addEventListener(
            "ended",
            () => {
              btn.style.display = "";
              video.controls = false;
            },
            { once: true }
          );
        } else {
          video.pause();
          video.controls = false;
          btn.style.display = "";
        }
      });
    });

    // Keep original safety: only one inline video at a time
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

  disconnectedCallback() {
    try {
      if (this.keenInstance?.destroy) this.keenInstance.destroy();
      else if (this.slider?.destroy) this.slider.destroy();
    } catch (_) {}

    window.removeEventListener("resize", this._onResizeUpdateThumb);
  }
}

customElements.define("featured-slider", FeaturedSlider);
