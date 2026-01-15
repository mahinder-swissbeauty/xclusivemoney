class FeaturedArticle extends HTMLElement {
  connectedCallback() {
    this.sliderWrapper = this.querySelector('[data-role="slider-wrapper"]');

    // Schema-based settings (data- attributes from Liquid)
    this.autoplay = this.dataset.autoplay === "true";
    this.interval = parseInt(this.dataset.slideInterval) || 4000;

    this.showArrows = this.dataset.showArrows === "true";
    this.showDots = this.dataset.showDots === "true";
    this.showPlayPause = this.dataset.showPlayPause === "true";

    // Mobile multi-slide settings
    this.enableMobileMulti = this.dataset.enableMobileMulti === "true";
    this.mobileSlidesPerView = parseFloat(this.dataset.mobileSlidesPerView) || 1;

    // Desktop slides per view (1 / 2 / 3 from schema)
    this.desktopPerView = parseFloat(this.dataset.desktopPerView) || 3;

    // Elements
    this.prevBtn = this.querySelector(".prev-arrow");
    this.nextBtn = this.querySelector(".next-arrow");
    this.dotsContainer = this.querySelector(".slider-dots");
    this.playPauseBtn = this.querySelector(".slider-play-pause");

    this.videos = [...this.querySelectorAll("video")];
    this.playing = this.autoplay;
    this.autoplayTimer = null;

    // wheel state
    this._wheelAccum = 0;
    this._wheelTimer = null;
    this._wheelHandler = null;

    this.initVideoPlayers();
    this.waitForKeen();
    this.applySchemaVisibility();
  }

  /* ---------------- Schema visibility ---------------- */

  applySchemaVisibility() {
    if (!this.showArrows) {
      this.prevBtn?.remove();
      this.nextBtn?.remove();
    }
    if (!this.showDots) {
      this.dotsContainer?.remove();
    }
    if (!this.showPlayPause) {
      this.playPauseBtn?.remove();
    }
  }

  /* ---------------- Keen loader ---------------- */

  waitForKeen() {
    if (window.KeenSlider) {
      this.initSlider();
    } else {
      setTimeout(() => this.waitForKeen(), 100);
    }
  }

  initSlider() {
    if (!this.sliderWrapper || !window.KeenSlider) return;

    this.slider = new KeenSlider(this.sliderWrapper, {
      loop: true,

      // MOBILE default (schema-controlled)
      slides: {
        perView: this.enableMobileMulti ? this.mobileSlidesPerView : 1,
        spacing: 10,
      },

      // Tablet / Desktop breakpoints
      breakpoints: {
        "(min-width: 768px)": {
          slides: { perView: 2, spacing: 24 },
        },
        "(min-width: 1200px)": {
          slides: { perView: this.desktopPerView, spacing: 32 },
        },
      },

      slideChanged: (s) => {
        this.pauseAllVideos();
        if (this.showDots) this.updateDots(s.track.details.rel);
      },

      created: (s) => {
        const totalSlides = s.track.details.slides.length;

        // If single slide, hide all controls
        if (totalSlides <= 1) {
          this.prevBtn?.remove();
          this.nextBtn?.remove();
          this.dotsContainer?.remove();
          this.playPauseBtn?.remove();
        }

        // Dots
        if (this.showDots && totalSlides > 1) {
          this.createDots(totalSlides);
          this.updateDots(0);
        }

        // Arrows
        if (this.showArrows && totalSlides > 1) {
          this.prevBtn?.addEventListener("click", () => s.prev());
          this.nextBtn?.addEventListener("click", () => s.next());
        }

        // Autoplay
        if (this.autoplay && totalSlides > 1) {
          this.initAutoplay();
        }

        // Play / Pause button
        if (this.showPlayPause && totalSlides > 1) {
          this.initPlayPauseControls();
        }

        // ✅ Trackpad horizontal scroll support (deltaX ONLY, no vertical trigger)
        this.enableTrackpadScroll(s);
      },
    });
  }

  /* =========================================================
     ✅ TRACKPAD LEFT/RIGHT ONLY (NO vertical scroll triggering)
     - Only runs when |deltaX| is meaningful AND dominates |deltaY|
     - preventDefault only for real horizontal gestures
  ========================================================= */
  enableTrackpadScroll(slider) {
    const target = this.sliderWrapper || this;

    // avoid duplicate binding (if section re-inits)
    if (this._wheelHandler) {
      try {
        target.removeEventListener("wheel", this._wheelHandler, {
          capture: true,
        });
      } catch (_) {}
      this._wheelHandler = null;
    }

    this._wheelHandler = (e) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      // ✅ ignore noise + ignore mostly-vertical scroll
      if (absX < 2 || absX <= absY) return;

      const details = slider.track?.details;
      if (!details) return;

      const atStart = details.progress <= 0.001;
      const atEnd = details.progress >= 0.999;

      // allow natural page behavior when slider can't move further
      if (e.deltaX < 0 && atStart) return;
      if (e.deltaX > 0 && atEnd) return;

      e.preventDefault();

      // accumulate for smooth feel
      this._wheelAccum += e.deltaX;

      clearTimeout(this._wheelTimer);
      this._wheelTimer = setTimeout(() => {
        this._wheelAccum = 0;
      }, 80);

      const TH = 25; // tweak if needed

      if (this._wheelAccum > TH) {
        this._wheelAccum = 0;
        slider.next();
      } else if (this._wheelAccum < -TH) {
        this._wheelAccum = 0;
        slider.prev();
      }
    };

    target.addEventListener("wheel", this._wheelHandler, {
      passive: false,
      capture: true,
    });
  }

  /* ---------------- AUTOPLAY ---------------- */

  initAutoplay() {
    this.pauseAutoplay();
    this.autoplayTimer = setInterval(() => {
      if (this.slider) this.slider.next();
    }, this.interval);
  }

  pauseAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  toggleAutoplay() {
    this.playing = !this.playing;

    if (this.playing) {
      // PAUSE ICON
      if (this.playPauseBtn) {
        this.playPauseBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M16 19C14.8954 19 14 18.1046 14 17V7C14 5.89543 14.8954 5 16 5C17.1046 5 18 5.89543 18 7V17C18 18.1046 17.1046 19 16 19ZM8 19C6.89543 19 6 18.1046 6 17V7C6 5.89543 6.89543 5 8 5C9.10457 5 10 5.89543 10 7V17C10 18.1046 9.10457 19 8 19Z" fill="#D9D9D9"/>
          </svg>
        `;
      }
      this.initAutoplay();
    } else {
      // PLAY ICON
      if (this.playPauseBtn) {
        this.playPauseBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z"></path>
          </svg>
        `;
      }
      this.pauseAutoplay();
    }
  }

  initPlayPauseControls() {
    if (!this.playPauseBtn) return;
    this.playPauseBtn.addEventListener("click", () => {
      this.toggleAutoplay();
    });
  }

  /* ---------------- DOTS ---------------- */

  createDots(count) {
    if (!this.dotsContainer) return;

    this.dotsContainer.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const dot = document.createElement("button");
      dot.className = "dot xcl-w-3 xcl-h-3 xcl-rounded-full xcl-bg-white/40";
      dot.dataset.index = i;

      dot.addEventListener("click", () => {
        if (this.slider) this.slider.moveToIdx(i);
      });

      this.dotsContainer.appendChild(dot);
    }
  }

  updateDots(activeIndex) {
    if (!this.dotsContainer) return;

    const dots = this.dotsContainer.querySelectorAll(".dot");
    dots.forEach((dot, i) => {
      dot.style.background = i === activeIndex ? "#fff" : "rgba(255,255,255,0.4)";
      if (i === activeIndex) dot.classList.add("is-active");
      else dot.classList.remove("is-active");
    });
  }

  /* ---------------- VIDEO LOGIC ---------------- */

  pauseAllVideos() {
    this.videos.forEach((video) => {
      try {
        video.pause();
      } catch (_) {}

      const wrapper = video.closest(".fc-video");
      if (!wrapper) return;

      const playBtn = wrapper.querySelector(".fc-video-play");
      if (playBtn) playBtn.style.display = "flex";

      const poster = wrapper.querySelector(".video-poster");
      if (poster) poster.style.display = "block";

      video.removeAttribute("src");
      video.load();
    });
  }

  initVideoPlayers() {
    const players = this.querySelectorAll(".fc-video");

    players.forEach((player) => {
      const poster = player.querySelector(".video-poster");
      const video = player.querySelector("video");
      const playBtn = player.querySelector(".fc-video-play");

      if (!video || !playBtn) return;

      playBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        this.pauseAllVideos();

        if (video.dataset.videoSrc) video.src = video.dataset.videoSrc;

        video.play().catch(() => {});

        if (poster) poster.style.display = "none";
        playBtn.style.display = "none";

        this.pauseAutoplay();
        this.playing = false;

        if (this.showPlayPause && this.playPauseBtn) {
          this.playPauseBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"></path>
            </svg>
          `;
        }
      });

      video.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!video.paused) {
          video.pause();
          if (playBtn) playBtn.style.display = "flex";
          if (poster) poster.style.display = "block";
        }
      });

      video.addEventListener("ended", () => {
        if (playBtn) playBtn.style.display = "flex";
        if (poster) poster.style.display = "block";
      });
    });
  }

  disconnectedCallback() {
    // stop autoplay
    this.pauseAutoplay();

    // destroy slider
    try {
      this.slider?.destroy();
    } catch (_) {}

    // cleanup wheel listener
    const target = this.sliderWrapper || this;
    if (this._wheelHandler) {
      try {
        target.removeEventListener("wheel", this._wheelHandler, { capture: true });
      } catch (_) {}
      this._wheelHandler = null;
    }
  }
}

customElements.define("featured-article", FeaturedArticle);






 