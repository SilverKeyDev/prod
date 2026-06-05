/**
 * Web: re-export Embla Carousel hook. Use via adapter so RN can swap implementation.
 * embla-carousel-react v8 exposes useEmblaCarousel as default, not named.
 */
import useEmblaCarousel from "embla-carousel-react";
export { useEmblaCarousel };
