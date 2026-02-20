import React, { useMemo } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/index.web";

export function useCarouselArrows(onAnimationStart: () => void) {
  return useMemo(() => {
    const LeftArrow = (
      clickHandler: () => void,
      hasPrev: boolean,
      label: string,
    ) => (
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          onAnimationStart();
          clickHandler();
        }}
        aria-label={label}
        disabled={!hasPrev}
        className={`absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-2xl p-2 transition-all duration-200 ${
          hasPrev
            ? "border border-gray-200 bg-white/90 text-gray-700 shadow-md hover:bg-white hover:text-brown hover:shadow-lg"
            : "cursor-not-allowed bg-gray-100 text-gray-400"
        }`}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
    );
    const RightArrow = (
      clickHandler: () => void,
      hasNext: boolean,
      label: string,
    ) => (
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          onAnimationStart();
          clickHandler();
        }}
        aria-label={label}
        disabled={!hasNext}
        className={`absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-2xl p-2 transition-all duration-200 ${
          hasNext
            ? "border border-gray-200 bg-white/90 text-gray-700 shadow-md hover:bg-white hover:text-brown hover:shadow-lg"
            : "cursor-not-allowed bg-gray-100 text-gray-400"
        }`}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    );
    return { LeftArrow, RightArrow };
  }, [onAnimationStart]);
}
