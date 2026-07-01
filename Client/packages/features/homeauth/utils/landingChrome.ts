/**
 * Fixed landing nav sits above content; main uses padding-top, sections use scroll-margin
 * so hash links and layout match the nav height (incl. safe area).
 */
export const LANDING_NAV_MAIN_OFFSET_CLASS = "pt-[calc(env(safe-area-inset-top,0px)+4rem)]";

export const LANDING_NAV_SCROLL_MARGIN_CLASS =
  "scroll-mt-[calc(env(safe-area-inset-top,0px)+4rem)]";

/** Solid gold signup CTA — white label on gold fill. */
export const LANDING_GOLD_SIGNUP_BUTTON_CLASS =
  "!bg-gold !text-white hover:!bg-gold/90 focus-visible:ring-gold border-transparent";

/** Italic accent inside landing section headlines (inherits parent Title size). */
export const LANDING_HEADLINE_ACCENT_CLASS = "!text-brand-primary italic";
