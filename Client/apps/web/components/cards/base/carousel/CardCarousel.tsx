import "react-responsive-carousel/lib/styles/carousel.min.css";

import React, { memo, useEffect, useMemo } from "react";

import { CardCarouselBody } from "./CardCarouselBody";
import { buildCardCarouselBodyProps } from "./cardCarouselBodyProps";
import type { CardCarouselProps } from "./CardCarouselTypes";
import { useCardCarouselState } from "./useCardCarouselState";
import { useCarouselArrows } from "./useCarouselArrows";

export type { CardCarouselProps } from "./CardCarouselTypes";

const DEFAULT_TRANSITION = 300;

function CardCarousel<T>(props: CardCarouselProps<T>) {
  const state = useCardCarouselState(props);
  const { LeftArrow, RightArrow } = useCarouselArrows(
    state.handleAnimationStart,
  );

  useEffect(() => {
    if (state.isAnimating) {
      const t = setTimeout(
        state.handleAnimationEnd,
        props.transitionTime ?? DEFAULT_TRANSITION,
      );
      return () => clearTimeout(t);
    }
  }, [state.isAnimating, props.transitionTime, state.handleAnimationEnd]);

  const bodyProps = useMemo(
    () => buildCardCarouselBodyProps(props, state, LeftArrow, RightArrow),
    [props, state, LeftArrow, RightArrow],
  );

  return (
    <div aria-label={props.ariaLabel} className="sk-carousel">
      {props.embeddedButton && (
        <div className="mb-6 flex w-full items-center justify-between sm:mb-8">
          <div className="flex h-10 items-center">
            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-800 hover:text-gray-900 transition-colors duration-200">
              {props.embeddedButton}
            </div>
          </div>
        </div>
      )}
      <CardCarouselBody {...bodyProps} />
    </div>
  );
}

export default memo(CardCarousel) as typeof CardCarousel;
