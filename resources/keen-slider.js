import KeenSlider from 'keen-slider';
import 'keen-slider/keen-slider.min.css'

window.KeenSlider = KeenSlider;

window.dispatchEvent(new Event("custom:KeenLoaded"));