class FeaturedSliderSingle extends HTMLElement {
  connectedCallback() {
    this.sliderWrapper = this.querySelector('[data-role="slider-wrapper"]');

    // Schema-based settings
    this.autoplay = this.dataset.autoplay === "true";
    this.interval = parseInt(this.dataset.slideInterval) || 4000;

    this.showArrows = this.dataset.showArrows === "true";
    this.showDots = this.dataset.showDots === "true";
    this.showPlayPause = this.dataset.showPlayPause === "true";

    // NEW: mobile multi-slide settings
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

    this.initVideoPlayers();
    this.waitForKeen();

    this.applySchemaVisibility();
  }

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

  waitForKeen() {
    if (window.KeenSlider) {
      this.initSlider();
    } else {
      setTimeout(() => this.waitForKeen(), 100);
    }
  }

  initSlider() {
    this.slider = new KeenSlider(this.sliderWrapper, {
      loop: true,

      // MOBILE default (schema-controlled)
      slides: {
        perView: this.enableMobileMulti ? this.mobileSlidesPerView : 1,
        spacing: 10
      },

      // Desktop / tablet breakpoints
      breakpoints: {
        "(min-width: 768px)": {
          slides: { perView: 1, spacing: 10 }
        },
        "(min-width: 1200px)": {
          slides: { perView: 1, spacing: 10 }
        }
      },

      slideChanged: (s) => {
        this.pauseAllVideos();
        if (this.showDots) this.updateDots(s.track.details.rel);
      },

      created: (s) => {
        const totalSlides = s.track.details.slides.length;

        // If single slide, hide controls
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
      }
    });
  }

  /* ---------------- AUTOPLAY ---------------- */

  initAutoplay() {
    this.autoplayTimer = setInterval(() => {
      if (this.slider) this.slider.next();
    }, this.interval);
  }

  pauseAutoplay() {
    clearInterval(this.autoplayTimer);
    this.autoplayTimer = null;
  }

  toggleAutoplay() {
    this.playing = !this.playing;

    if (this.playing) {
      // PAUSE ICON
      this.playPauseBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M16 19C14.8954 19 14 18.1046 14 17V7C14 5.89543 14.8954 5 16 5C17.1046 5 18 5.89543 18 7V17C18 18.1046 17.1046 19 16 19ZM8 19C6.89543 19 6 18.1046 6 17V7C6 5.89543 6.89543 5 8 5C9.10457 5 10 5.89543 10 7V17C10 18.1046 9.10457 19 8 19Z" fill="#D9D9D9"/>
        </svg>
      `;
      this.initAutoplay();
    } else {
      // PLAY ICON
      this.playPauseBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M8 5v14l11-7z"></path>
        </svg>
      `;
      this.pauseAutoplay();
    }
  }

  initPlayPauseControls() {
    this.playPauseBtn.addEventListener("click", () => {
      this.toggleAutoplay();
    });
  }

  /* ---------------- DOTS ---------------- */

  createDots(count) {
    if (!this.dotsContainer) return;

    this.dotsContainer.innerHTML = "";

    for (let i = 0; i < count; i++) {
      let dot = document.createElement("button");
      dot.className = "dot sw-w-3 sw-h-3 sw-rounded-full sw-bg-white/40";
      dot.dataset.index = i;

      dot.addEventListener("click", () => {
        this.slider.moveToIdx(i);
      });

      this.dotsContainer.appendChild(dot);
    }
  }

  updateDots(activeIndex) {
    if (!this.dotsContainer) return;

    const dots = this.dotsContainer.querySelectorAll(".dot");
    dots.forEach((dot, i) => {
      dot.style.background = i === activeIndex ? "#fff" : "rgba(255,255,255,0.4)";
      if (i === activeIndex) {
        dot.classList.add("is-active");
      } else {
        dot.classList.remove("is-active");
      }
    });
  }

  /* ---------------- VIDEO LOGIC ---------------- */

  pauseAllVideos() {
    this.videos.forEach(video => {
      video.pause();

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

    players.forEach(player => {
      const poster = player.querySelector(".video-poster");
      const video = player.querySelector("video");
      const playBtn = player.querySelector(".fc-video-play");

      if (!video || !playBtn) return;

      playBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        this.pauseAllVideos();

        video.src = video.dataset.videoSrc;
        video.play();

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
}

customElements.define("featured-slider-single", FeaturedSliderSingle);
