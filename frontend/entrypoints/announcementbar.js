class AnnouncementBar extends HTMLElement {
  constructor() {
    super();
    this.container = this.querySelector('[data-role="container"]');
    this.blocks = Array.from(
      this.querySelectorAll('[data-role="announcement-strip"]') 
    );
    this.autoplay = this.dataset.autoplay;
    this.interval = 0;
    this.autplayTime = Number(this.dataset.time) * 1000;
    this.copyBlocks = this.blocks.filter(
      (el) => el.dataset.beahavior == "copy"
    );
    this.redirectionBlocks = this.blocks.filter(
      (el) => el.dataset.behavior == "redirect"
    );
    this.nextArrow = this.querySelector('[data-role="next"]');
    this.prevArrow = this.querySelector('[data-role="prev"]');

    if (this.nextArrow) {
      this.nextArrow.addEventListener("click", () => {
        this.slider.next();
      });
    }
    if (this.prevArrow) {
      this.prevArrow.addEventListener("click", () => {
        this.slider.prev();
      });
    }
    this.copyBlocks.forEach((el) => {
      el.addEventListener("click", () => {
        let text = el.dataset.content;
        this.copyCoupon.call(this, text);
        this.copyAnimation.call(this, el);
      });
    });
    this.blocks.forEach(el => el.addEventListener('click',() =>{
      this.dataLayerPushOnClick(el)
    }))
  }
  connectedCallback() {
    if (window.KeenSlider) {
      this.blocks.length > 1 ? this.initializeSlider.call(this) : "";
      this.blocks.length > 1 ? this.enableAutoplay.call(this) : "";
    } else {
      window.addEventListener("custom:KeenLoaded", () => {
        this.blocks.length > 1 ? this.initializeSlider.call(this) : "";
        this.blocks.length > 1 ? this.enableAutoplay.call(this) : "";
      });
    }
  }
  copyAnimation(el) {
    el.classList.add("copied");
    setTimeout(() => {
      el.classList.remove("copied");
    }, 3000);
  }
  copyCoupon(text) {
    navigator.clipboard.writeText(text);
  }
  dataLayerPushOnClick(el){
    dataLayer.push({
      'event': window.custom_data_events.announcement.events.click,
      "offer_text": el.dataset.text
    })
  }
  enableAutoplay() {
    if (this.autoplay) {
      this.sliderAutoplay.call(this, true);
      this.prevArrow.addEventListener("click", () => {
        this.sliderAutoplay.call(this, false);
      });
      this.blocks.forEach((el) => {
        el.addEventListener("click", () => {
          this.sliderAutoplay.call(this, false);
        });
      });
      this.nextArrow.addEventListener("click", () => {
        this.sliderAutoplay.call(this, false);
      });
    }
  }
  sliderAutoplay(run) {
    clearInterval(this.interval);
    this.interval = setInterval(() => {
      if (run && this.slider) {
        this.slider.next();
      }
    }, this.autplayTime);
  }
  initializeSlider() {
    this.container.style.maxHeight = getComputedStyle(
      this.container
    ).getPropertyValue("height");
    this.slider = new window.KeenSlider(this.container, {
      loop: true,
      slides: {
        origin: "center",
        perView: 1,
      },
      vertical: true,
    });
  }
}
customElements.define("announcement-bar", AnnouncementBar);
