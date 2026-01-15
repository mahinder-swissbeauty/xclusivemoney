import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";

/* -------------------------------
  ✅ Global helpers (safe)
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
  // Fancybox sometimes leaves scroll lock + padding behind
  document.documentElement.style.overflow = "";
  document.body.style.overflow = "";
  document.documentElement.style.paddingRight = "";
  document.body.style.paddingRight = "";
  document.body.classList.remove("compensate-for-scrollbar");

  // prevent accidental horizontal scroll
  document.documentElement.style.overflowX = "hidden";
  document.body.style.overflowX = "hidden";
}

function fcDispatchClosed() {
  window.dispatchEvent(new Event("fc:fancyboxClosed"));
}

class FeaturedSliderSingle extends HTMLElement {
  connectedCallback() {
    this.sliderWrapper = this.querySelector('[data-role="slider-wrapper"]');

    // Schema-based settings
    this.autoplay = this.dataset.autoplay === "true";
    this.interval = parseInt(this.dataset.slideInterval) || 4000;

    this.showArrows = this.dataset.showArrows === "true";
    this.showDots = this.dataset.showDots === "true";
    this.showPlayPause = this.dataset.showPlayPause === "true";

    // Mobile multi-slide settings
    this.enableMobileMulti = this.dataset.enableMobileMulti === "true";
    this.mobileSlidesPerView = parseFloat(this.dataset.mobileSlidesPerView) || 1;

    // Elements
    this.prevBtn = this.querySelector(".prev-arrow");
    this.nextBtn = this.querySelector(".next-arrow");
    this.dotsContainer = this.querySelector(".slider-dots");
    this.playPauseBtn = this.querySelector(".slider-play-pause");

    this.videos = [...this.querySelectorAll("video")];
    this.playing = this.autoplay;
    this.autoplayTimer = null;

    // binders
    this._onResizeFix = () => this.safeUpdateAfterPopup();
    this._onVisibility = () => {
      if (document.hidden) this.pauseAutoplay();
      else if (this.playing && this.autoplay) this.initAutoplay();
    };

    // ✅ listen Fancybox close globally (safer)
    this._onFancyboxClosed = () => this.safeUpdateAfterPopup();

    // Fancybox (bind once globally)
    this.initFancyboxOnce();

    // Existing behavior
    this.initVideoPlayers();
    this.waitForKeen();
    this.applySchemaVisibility();

    document.addEventListener("visibilitychange", this._onVisibility);
    window.addEventListener("resize", this._onResizeFix);
    window.addEventListener("fc:fancyboxClosed", this._onFancyboxClosed);
  }

  disconnectedCallback() {
    this.pauseAutoplay();
    document.removeEventListener("visibilitychange", this._onVisibility);
    window.removeEventListener("resize", this._onResizeFix);
    window.removeEventListener("fc:fancyboxClosed", this._onFancyboxClosed);

    try {
      this.slider?.destroy?.();
    } catch (_) {}
  }

  /* ---------------- FANCYBOX ---------------- */

  initFancyboxOnce() {
    if (window.__fcFancyboxBound) return;
    window.__fcFancyboxBound = true;

    Fancybox.bind("[data-fancybox]", {
      animated: true,
      dragToClose: true,
      closeButton: "top",

      // ✅ (optional) popup free scroll feel
      Carousel: {
        friction: 0.92,
        wheel: "slide",
      },

      Html5video: {
        autoplay: true,
      },

      on: {
        closing: (fb) => {
          // stop videos inside popup
          fcStopAndResetVideos(fb?.container);
        },

        "Carousel.change": (fb) => {
          fcStopAndResetVideos(fb?.container);
        },

        // ✅ best: after popup close, unlock scroll + refresh sliders
        close: () => {
          fcUnlockScroll();
          fcDispatchClosed();
        },

        // extra safety
        destroy: () => {
          fcUnlockScroll();
          fcDispatchClosed();
        },
      },
    });

    // ✅ ESC always closes
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        try {
          Fancybox.close();
        } catch (_) {}
      }
    });
  }

  safeUpdateAfterPopup() {
    // ✅ Fix: sometimes Keen gets width wrong -> right gap / horizontal scroll
    try {
      fcUnlockScroll();

      // force reflow
      // eslint-disable-next-line no-unused-expressions
      this.sliderWrapper?.offsetWidth;

      const run = () => {
        try {
          this.slider?.update?.();
        } catch (_) {}
      };

      run();
      requestAnimationFrame(run);
      setTimeout(run, 60);
    } catch (_) {}
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
    if (!this.sliderWrapper) return;

    this.slider = new KeenSlider(this.sliderWrapper, {
      loop: true,

      slides: {
        perView: this.enableMobileMulti ? this.mobileSlidesPerView : 1,
        spacing: 10,
      },

      breakpoints: {
        "(min-width: 768px)": {
          slides: { perView: 1, spacing: 10 },
        },
        "(min-width: 1200px)": {
          slides: { perView: 1, spacing: 10 },
        },
      },

      slideChanged: (s) => {
        this.pauseAllVideos();
        if (this.showDots) this.updateDots(s.track.details.rel);
      },

      created: (s) => {
        const totalSlides = s.track.details.slides.length;

        if (totalSlides <= 1) {
          this.prevBtn?.remove();
          this.nextBtn?.remove();
          this.dotsContainer?.remove();
          this.playPauseBtn?.remove();
        }

        if (this.showDots && totalSlides > 1) {
          this.createDots(totalSlides);
          this.updateDots(0);
        }

        if (this.showArrows && totalSlides > 1) {
          this.prevBtn?.addEventListener("click", () => s.prev());
          this.nextBtn?.addEventListener("click", () => s.next());
        }

        if (this.autoplay && totalSlides > 1) {
          this.initAutoplay();
        }

        if (this.showPlayPause && totalSlides > 1) {
          this.initPlayPauseControls();
        }

        // ✅ add wheel based “free hand” horizontal scroll (trackpad) - only horizontal
        this.wheelControlsOnlyHorizontal(s);
      },
    });
  }

  /* ---------------- WHEEL CONTROLS (ONLY HORIZONTAL) ----------------
     - Trackpad left/right swipe triggers ksDrag events
     - Vertical scroll will NOT move slider
  ------------------------------------------------------------------- */
  wheelControlsOnlyHorizontal(slider) {
    let touchTimeout;
    let position;
    let wheelActive = false;

    const dispatch = (e, name) => {
      position.x -= e.deltaX;
      // IMPORTANT: do not apply deltaY
      slider.container.dispatchEvent(
        new CustomEvent(name, {
          detail: { x: position.x, y: position.y },
        })
      );
    };

    const wheelStart = (e) => {
      position = { x: e.pageX, y: e.pageY };
      dispatch(e, "ksDragStart");
    };

    const wheelMove = (e) => dispatch(e, "ksDrag");
    const wheelEnd = (e) => dispatch(e, "ksDragEnd");

    const eventWheel = (e) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      // ✅ allow normal page vertical scroll
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
    };

    slider.container.addEventListener("wheel", eventWheel, { passive: false });

    slider.on("destroyed", () => {
      slider.container.removeEventListener("wheel", eventWheel);
    });
  }

  /* ---------------- AUTOPLAY ---------------- */

  initAutoplay() {
    this.pauseAutoplay();
    this.autoplayTimer = setInterval(() => {
      this.slider?.next?.();
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
      if (this.playPauseBtn) {
        this.playPauseBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M16 19C14.8954 19 14 18.1046 14 17V7C14 5.89543 14.8954 5 16 5C17.1046 5 18 5.89543 18 7V17C18 18.1046 17.1046 19 16 19ZM8 19C6.89543 19 6 18.1046 6 17V7C6 5.89543 6.89543 5 8 5C9.10457 5 10 5.89543 10 7V17C10 18.1046 9.10457 19 8 19Z" fill="#D9D9D9"/>
          </svg>
        `;
      }
      this.initAutoplay();
    } else {
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
    this.playPauseBtn.addEventListener("click", () => this.toggleAutoplay());
  }

  /* ---------------- DOTS ---------------- */

  createDots(count) {
    if (!this.dotsContainer) return;

    this.dotsContainer.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const dot = document.createElement("button");
      dot.className =
        "dot xcl-w-3 xcl-h-3 xcl-rounded-full xcl-border-none xcl-outline-none xcl-bg-white/40";
      dot.dataset.index = i;

      dot.addEventListener("click", () => {
        this.slider?.moveToIdx?.(i);
      });

      this.dotsContainer.appendChild(dot);
    }
  }

  updateDots(activeIndex) {
    if (!this.dotsContainer) return;
    const dots = this.dotsContainer.querySelectorAll(".dot");
    dots.forEach((dot, i) => {
      dot.style.background =
        i === activeIndex ? "#fff" : "rgba(255,255,255,0.4)";
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

      try {
        video.removeAttribute("src");
        video.load();
      } catch (_) {}
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
        e.preventDefault();
        e.stopPropagation();

        this.pauseAutoplay();
        this.playing = false;

        if (this.showPlayPause && this.playPauseBtn) {
          this.playPauseBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"></path>
            </svg>
          `;
        }

        const slide = e.target.closest(".keen-slider__slide");
        const link = slide?.querySelector(".fc-fancybox-link[data-fancybox]");
        if (link) {
          link.click();
          return;
        }

        this.pauseAllVideos();
        video.src = video.dataset.videoSrc;
        video.play().catch(() => {});
        if (poster) poster.style.display = "none";
        playBtn.style.display = "none";
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
}

customElements.define("featured-slider-single", FeaturedSliderSingle);
 