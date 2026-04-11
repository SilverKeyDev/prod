/**
 * Box and Row default layout classes - single source of truth for web and native.
 * Platform files must import from here; they must NOT define local DEFAULT_*_CLASSES.
 *
 * Note: We omit items-stretch so that items-center/justify-center passed via className
 * reliably override. The browser/RN default for align-items is stretch, so behavior is
 * unchanged when no alignment override is passed.
 */

/** Default flex layout for Box: column direction (stretch is browser default) */
export const BOX_DEFAULT_CLASSES = "flex flex-col";

/** Default flex layout for Row: row direction (stretch is browser default) */
export const ROW_DEFAULT_CLASSES = "flex flex-row";
