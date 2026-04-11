/**
 * Fixed landing nav sits above content; main uses padding-top, sections use scroll-margin
 * so hash links and layout match the nav height (incl. safe area).
 */
export const LANDING_NAV_MAIN_OFFSET_CLASS =
  "pt-[calc(env(safe-area-inset-top,0px)+4rem)]";

export const LANDING_NAV_SCROLL_MARGIN_CLASS =
  "scroll-mt-[calc(env(safe-area-inset-top,0px)+4rem)]";
