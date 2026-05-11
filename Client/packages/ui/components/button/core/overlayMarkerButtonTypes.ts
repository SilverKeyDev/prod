/**
 * Shared size constants for overlay/marker buttons (e.g. CloseButton in modals,
 * CardHeartSave on property cards). Use these so the X button and heart marker
 * stay the same size across the app.
 */

/** Tailwind classes for the overlay/marker button container (circle hit area). */
export const OVERLAY_MARKER_CIRCLE_CLASSES = "w-9 h-9 min-w-9 min-h-9" as const;

/** Tailwind classes for the icon inside the overlay/marker button. */
export const OVERLAY_MARKER_ICON_CLASSES = "w-4 h-4" as const;

/** IconButton size prop value that corresponds to overlay/marker usage. */
export const OVERLAY_MARKER_ICON_BUTTON_SIZE = "sm" as const;
