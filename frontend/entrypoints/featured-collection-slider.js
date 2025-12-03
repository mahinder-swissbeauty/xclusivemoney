class FeaturedSlider extends HTMLElement {
    constructor() {
        super();
        this.sliderWrapper = this.querySelector('[data-role="slider-wrapper"]');
        this.thumbWrapper = this.querySelector('[data-role="thumb-wrapper"]');
        this.sliderThumb = this.querySelector('[data-role="thumb"]');

        // attributes
        this.desktopCards = parseInt(this.dataset.desktopCards) || 3;
        this.mobilePerView = parseFloat(this.dataset.mobilePerview) || 1.2;

        // store refs
        this.slides = [];
        this.slider = null;
        this.keenInstance = null;
    }

    connectedCallback() {
        if (window.KeenSlider) {
            this.initializeSlider(window.KeenSlider);
        } else {
            document.addEventListener("custom:KeenLoaded", () => {
                if (window.KeenSlider) this.initializeSlider(window.KeenSlider);
            });
        }
    }

    initializeSlider(KeenSliderClass) {
        if (!this.sliderWrapper) return;

        // collect slides
        this.slides = Array.from(this.sliderWrapper.querySelectorAll('.keen-slider__slide'));

        // compute perView
        const perViewMobile = this.mobilePerView;
        const perViewDesktop = Math.max(1, this.desktopCards);

        // spacing
        const spacingMobile = 16;
        const spacingDesktop = 32;

        this.keenInstance = new KeenSliderClass(this.sliderWrapper, {
            loop: false,
            rubberband: false,
            mode: 'free',
            drag: true,
            slides: {
                perView: perViewMobile,
                spacing: spacingMobile,
                origin: 'auto'  
            },
            breakpoints: {
                '(min-width: 768px)': {
                    slides: {
                        perView: perViewDesktop,
                        spacing: spacingDesktop,
                        origin: 'auto' ,
                        rubberband: false,
                        mode: 'free',
                        drag: true
                    }
                }
            }
        }, [
            (slider) => {
                slider.on('created', () => {
                    this.slider = slider;
                    this.setupArrows();
                    this.wheelControls(slider);
                    this.setupThumbSync(slider);
                    this.attachVideoControls();
                    this.updateThumb();

                    slider.on('slideChanged', () => this.pauseAllVideos());
                });
            }
        ]);
    }

    /* -------------------------------
       AUTO HIDE ARROWS BASED ON SLIDES
    ---------------------------------*/
    setupArrows() {
        const prev = this.querySelector('[data-role="arrow-prev"]');
        const next = this.querySelector('[data-role="arrow-next"]');

        const total = this.slides.length;
        const currentPerView = (window.innerWidth >= 768)
            ? Math.max(1, this.desktopCards)
            : this.mobilePerView;

        // hide/show arrows
        const shouldShow = total > currentPerView;

        if (prev) prev.style.display = shouldShow ? "" : "none";
        if (next) next.style.display = shouldShow ? "" : "none";

        if (!shouldShow) return;

        if (prev) prev.addEventListener('click', () => this.slider.prev());
        if (next) next.addEventListener('click', () => this.slider.next());
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

        slider.on('detailsChanged', update);
        window.addEventListener('resize', update);

        const observer = new MutationObserver(update);
        observer.observe(this.sliderWrapper, { childList: true, subtree: true });
    }

    /* -------------------------------
       AUTO HIDE BOTTOM SCROLL BAR
    ---------------------------------*/
    updateThumb() {
        if (!this.slider || !this.sliderThumb || !this.thumbWrapper) return;

        const totalSlides = this.slider.track.details.slides.length || this.slides.length || 1;
        const currentPerView = (window.innerWidth >= 768)
            ? Math.max(1, this.desktopCards)
            : this.mobilePerView;

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

    attachVideoControls() {
        const videos = Array.from(this.querySelectorAll('video'));

        videos.forEach((v) => {
            const src = v.dataset.videoSrc;
            if (src && !v.querySelector('source')) {
                v.src = src;
                v.preload = 'metadata';
                v.controls = false;
                v.pause();
            }
        });

        const playButtons = Array.from(this.querySelectorAll('.fc-video-play'));

        playButtons.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const slideEl = btn.closest('.keen-slider__slide');
                if (!slideEl) return;

                const video = slideEl.querySelector('video');
                if (!video) return;

                this.pauseAllVideos(video);

                if (video.paused) {
                    video.play().catch(() => {});
                    video.controls = true;
                    btn.style.display = 'none';

                    video.addEventListener('ended', () => {
                        btn.style.display = '';
                        video.controls = false;
                    }, { once: true });

                } else {
                    video.pause();
                    video.controls = false;
                    btn.style.display = '';
                }
            });
        });

        videos.forEach((v) => {
            v.addEventListener('play', () => this.pauseAllVideos(v));
            v.addEventListener('pause', () => {
                const slideEl = v.closest('.keen-slider__slide');
                if (!slideEl) return;

                const btn = slideEl.querySelector('.fc-video-play');
                if (btn) btn.style.display = '';
            });
        });
    }

    pauseAllVideos(except = null) {
        const videos = Array.from(this.querySelectorAll('video'));
        videos.forEach((v) => {
            if (except && v === except) return;
            try { v.pause(); v.controls = false; } catch (_) {}

            const slideEl = v.closest('.keen-slider__slide');
            if (slideEl) {
                const btn = slideEl.querySelector('.fc-video-play');
                if (btn) btn.style.display = '';
            }
        });
    }

    disconnectedCallback() {
        try {
            if (this.keenInstance?.destroy) this.keenInstance.destroy();
            else if (this.slider?.destroy) this.slider.destroy();
        } catch (_) {}

        window.removeEventListener('resize', this.updateThumb);
    }
}

customElements.define('featured-slider', FeaturedSlider);
