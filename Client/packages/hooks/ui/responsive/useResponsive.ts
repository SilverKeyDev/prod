import { useMemo } from "react";

import { screenDown, screenUp } from "packages/ui/types/screens";

import { useMediaQuery } from "./useMediaQuery";

export type ResponsiveState = {
  // Explicit, Tailwind-aligned names
  isXsDown: boolean;
  isSmDown: boolean;
  isMdDown: boolean;
  isLgDown: boolean;

  isSmUp: boolean;
  isMdUp: boolean;
  isLgUp: boolean;
  isXlUp: boolean;

  // Friendly aliases (avoid ambiguity by tying to explicit meaning)
  isMobile: boolean; // strictly < md
  isDesktop: boolean; // >= md
};

export function useResponsive(): ResponsiveState {
  // Down: strictly below the breakpoint (Tailwind `md:hidden` semantics).
  const isXsDown = useMediaQuery(screenDown("xs"));
  const isSmDown = useMediaQuery(screenDown("sm"));
  const isMdDown = useMediaQuery(screenDown("md"));
  const isLgDown = useMediaQuery(screenDown("lg"));

  // Up: at or above the breakpoint (Tailwind `md:block` semantics).
  const isSmUp = useMediaQuery(screenUp("sm"));
  const isMdUp = useMediaQuery(screenUp("md"));
  const isLgUp = useMediaQuery(screenUp("lg"));
  const isXlUp = useMediaQuery(screenUp("xl"));

  return useMemo(
    () => ({
      isXsDown,
      isSmDown,
      isMdDown,
      isLgDown,
      isSmUp,
      isMdUp,
      isLgUp,
      isXlUp,
      isMobile: isMdDown,
      isDesktop: isMdUp,
    }),
    [isLgDown, isLgUp, isMdDown, isMdUp, isSmDown, isSmUp, isXlUp, isXsDown]
  );
}

export function useIsMobile(): boolean {
  return useMediaQuery(screenDown("md"));
}
