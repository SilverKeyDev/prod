/**
 * FileUpload styles — single source of truth for web and native.
 * Platform files must import from here; they must NOT define local style strings.
 */

import {
  DASHED_BORDER_BOX_GRAY_300,
  DASHED_BORDER_BOX_NEUTRAL_300,
  DASHED_BORDER_THIN_GRAY_300,
  DOTTED_BORDER_LIGHT_GRAY,
} from "packages/ui/components/primitives/divider/dividerStyles";

export { DOTTED_BORDER_LIGHT_GRAY };
import { HOVER_BG_CLASSES } from "packages/ui/styles/transitions/transitionClasses";

/** Drop zone border — web uses dashed; native uses solid (dashed unreliable on RN) */
export const DROP_ZONE_BORDER_WEB = DASHED_BORDER_BOX_NEUTRAL_300;
export const DROP_ZONE_BORDER_NATIVE = "border-2 border-border";

/** Drop zone base — dashed border (web), padding */
export const FILE_UPLOAD_DROP_ZONE_BASE = `rounded-lg p-8 text-center ${DROP_ZONE_BORDER_WEB} ${HOVER_BG_CLASSES}`;

/** Drop zone compact — for ImagePicker (p-6) */
export const FILE_UPLOAD_DROP_ZONE_COMPACT = `rounded-lg p-6 text-center ${DROP_ZONE_BORDER_WEB} ${HOVER_BG_CLASSES}`;

/** Drop zone default state */
export const FILE_UPLOAD_DROP_ZONE_DEFAULT =
  "border-border hover:border-primary active:border-primary";

/** Drop zone drag-over state */
export const FILE_UPLOAD_DROP_ZONE_DRAG = "border-brand-accent bg-neutral-100";

/** Drop zone with items-center (native uses solid border, rounded-xl for touch) */
export const FILE_UPLOAD_DROP_ZONE_NATIVE =
  "items-center rounded-xl border-2 border-border bg-primary-muted p-8";

/** Disabled/loading state */
export const FILE_UPLOAD_DISABLED = "opacity-50 cursor-not-allowed";

/** Disabled for native (no cursor) */
export const FILE_UPLOAD_DISABLED_NATIVE = "opacity-50";

/** Enabled cursor */
export const FILE_UPLOAD_ENABLED = "cursor-pointer";

/** Base dashed border for drop zones (add state colors separately) */
export const DROP_ZONE_BORDER_BASE = `rounded-lg ${DROP_ZONE_BORDER_WEB}`;

/** Empty state / add-more container (e.g. empty list, add todo) */
export const EMPTY_STATE_DASHED_BORDER = DASHED_BORDER_THIN_GRAY_300;

/** Add button dashed border (e.g. add location, add another) */
export const ADD_BUTTON_DASHED_BORDER = `rounded-lg ${DASHED_BORDER_BOX_GRAY_300}`;

/** Trigger/input-style dashed border (e.g. location picker trigger) */
export const TRIGGER_DASHED_BORDER = DASHED_BORDER_BOX_GRAY_300;

/** Location input container — dotted light gray outline, high contrast */
export const LOCATION_INPUT_CONTAINER = `rounded-lg bg-background-surface p-4 ${DOTTED_BORDER_LIGHT_GRAY}`;
