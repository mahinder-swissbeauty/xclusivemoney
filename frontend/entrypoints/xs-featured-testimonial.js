class FeaturedSliderTestimonial extends HTMLElement {
  constructor() {
    super();

    this.sliderWrapper = this.querySelector('[data-role="slider-wrapper"]');
    this.thumbWrapper = this.querySelector('[data-role="thumb-wrapper"]');
    this.sliderThumb = this.querySelector('[data-role="thumb"]');

    this.desktopCards = parseFloat(this.dataset.desktopCards) || 2.5;
    this.mobilePerView = parseFloat(this.dataset.mobilePerview) || 1.2;

    this.slides = [];
    this.slider = null;

    this._onResize = () => {
      this.setupArrows();
      this.updateThumb();
    };

    // wheel state
    this._wheelAccum = 0;
    this._wheelTimer = null;

    // keep reference for cleanup
    this._wheelHandler = null;
  }

  connectedCallback() {
    if (!this.sliderWrapper) return;

    const boot = () => {
      if (!window.KeenSlider) return;
      this.init(window.KeenSlider);
    };

    boot();
    document.addEventListener("custom:KeenLoaded", boot, { once: true });
  }

  init(KeenSliderClass) {
    this.slides = Array.from(
      this.sliderWrapper.querySelectorAll(".keen-slider__slide")
    );

    const spacingMobile = 16;
    const spacingDesktop = 32;

    this.slider = new KeenSliderClass(this.sliderWrapper, {
      loop: false,
      rubberband: false,
      mode: "free",
      drag: true,
      slides: { perView: this.mobilePerView, spacing: spacingMobile },
      breakpoints: {
        "(min-width: 768px)": {
          slides: {
            perView: Math.max(1, this.desktopCards),
            spacing: spacingDesktop,
          },
        },
      },

      created: (s) => {
        this.setupArrows();
        this.setupThumbSync();
        this.updateThumb();

        // ✅ Trackpad horizontal scroll support (deltaX only)
        this.enableTrackpadScroll(s);
      },

      detailsChanged: () => this.updateThumb(),
    });
  }

  /* =========================================================
     ✅ TRACKPAD LEFT/RIGHT ONLY (NO vertical scroll triggering)
     - Only runs when |deltaX| is meaningful AND dominates |deltaY|
     - PreventDefault only for that horizontal gesture
  ========================================================= */
  enableTrackpadScroll(slider) {
    const target =
      this.querySelector("[data-keen-el]") ||
      this.sliderWrapper ||
      this; // fallback safe

    this._wheelHandler = (e) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      // ✅ Only true horizontal gestures
      // - ignore tiny noise
      // - ignore mostly-vertical scroll
      if (absX < 2 || absX <= absY) return;

      const details = slider.track?.details;
      if (!details) return;

      const atStart = details.progress <= 0.001;
      const atEnd = details.progress >= 0.999;

      // allow natural page scroll when slider can't move further
      if (e.deltaX < 0 && atStart) return;
      if (e.deltaX > 0 && atEnd) return;

      // block default ONLY for horizontal gesture
      e.preventDefault();

      // accumulate to avoid micro-step jitter
      this._wheelAccum += e.deltaX;

      clearTimeout(this._wheelTimer);
      this._wheelTimer = setTimeout(() => {
        this._wheelAccum = 0;
      }, 80);

      const TH = 25; // threshold; tweak if needed

      if (this._wheelAccum > TH) {
        this._wheelAccum = 0;
        slider.next();
      } else if (this._wheelAccum < -TH) {
        this._wheelAccum = 0;
        slider.prev();
      }
    };

    // capture phase helps when overlays exist
    target.addEventListener("wheel", this._wheelHandler, {
      passive: false,
      capture: true,
    });
  }

  setupArrows() {
    const prev = this.querySelector('[data-role="arrow-prev"]');
    const next = this.querySelector('[data-role="arrow-next"]');

    if (!prev && !next) return;

    const total = this.slides.length;
    const currentPerView =
      window.innerWidth >= 768
        ? Math.max(1, this.desktopCards)
        : this.mobilePerView;

    const shouldShow = total > currentPerView;

    if (prev) prev.style.display = shouldShow ? "" : "none";
    if (next) next.style.display = shouldShow ? "" : "none";
    if (!shouldShow) return;

    if (prev) prev.onclick = () => this.slider?.prev();
    if (next) next.onclick = () => this.slider?.next();
  }

  setupThumbSync() {
    if (!this.thumbWrapper || !this.sliderThumb) return;
    window.addEventListener("resize", this._onResize);
  }

  updateThumb() {
    if (!this.slider || !this.thumbWrapper || !this.sliderThumb) return;

    const totalSlides = this.slider.track.details.slides.length || 1;
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

    this.sliderThumb.style.width = `${thumbWidthPx}px`;
    this.sliderThumb.style.left = `${progress * maxLeftPx}px`;
  }

  disconnectedCallback() {
    try {
      this.slider?.destroy();
    } catch (e) {}

    window.removeEventListener("resize", this._onResize);

    // cleanup wheel listener
    const target =
      this.querySelector("[data-keen-el]") || this.sliderWrapper || this;

    if (this._wheelHandler) {
      target.removeEventListener("wheel", this._wheelHandler, {
        capture: true,
      });
    }
  }
}

customElements.define(
  "featured-slider-testimonial",
  FeaturedSliderTestimonial
);
   