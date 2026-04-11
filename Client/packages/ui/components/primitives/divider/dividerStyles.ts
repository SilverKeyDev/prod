/**
 * Shared divider styles - single source of truth for DashedDivider web and native.
 * Platform files must import from here per require-shared-platform-styles.
 *
 * Web: Uses CSS border-dashed for DashedDivider.web and drop zones.
 * Native: DashedDivider.native uses react-native-svg; drop zones use solid borders via fileUploadStyles.
 */
export const DASH_LENGTH = 6;

/** Gap length for native SVG strokeDasharray */
export const GAP_LENGTH = 4;

/** Web: horizontal dashed divider base classes (DashedDivider.web) */
export const DASHED_DIVIDER_HORIZONTAL_CLASSES =
  "border-t-2 border-dashed border-border w-full";

/** Web: vertical dashed divider base classes (DashedDivider.web) */
export const DASHED_DIVIDER_VERTICAL_CLASSES =
  "border-l-2 border-dashed border-border h-full";

/** Web: dashed border for drop zones / panels (border-2) */
export const DASHED_BORDER_BOX_NEUTRAL_300 =
  "border-2 border-dashed border-border";
export const DASHED_BORDER_BOX_GRAY_200 =
  "border-2 border-dashed border-border";
export const DASHED_BORDER_BOX_GRAY_300 =
  "border-2 border-dashed border-border";

/** Web: thin dashed border (border-1) */
export const DASHED_BORDER_THIN_GRAY_300 = "border border-dashed border-border";

/** Web: dotted light gray border for location inputs and similar */
export const DOTTED_BORDER_LIGHT_GRAY =
  "border-2 border-dotted border-neutral-300";
