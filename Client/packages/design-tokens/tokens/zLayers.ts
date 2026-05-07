/**
 * Global z-index layer tokens (platform-agnostic).
 *
 * Single source of truth for stacking context values shared across web (Tailwind
 * theme extension) and React Native (inline StyleSheet values).
 *
 * Industry-standard ordering (low → high):
 *   Layout chrome → Dropdown/popover → Toast → Overlay → Modal → Modal-popover → Skip
 *
 * No React, no platform imports — pure data.
 */

export const Z_LAYERS = {
  /** App header bar. */
  header: 100,
  /** Navigation sidebar. */
  sidebar: 200,
  /** Mobile bottom dock / tab bar. */
  dock: 300,
  /** Menus, selects, autocomplete, portaled popovers — above layout chrome and map markers (~1000). */
  dropdown: 5000,
  /** Toast/snackbar notifications — above dropdowns. */
  toast: 8000,
  /** Full-screen overlay/backdrop — above toasts, below modals. */
  overlay: 9000,
  /** Modal dialogs and sheets. */
  modal: 10000,
  /**
   * Full-screen hit target rendered between z-modal and z-modal-popover so
   * stray picks / double-clicks do not reach the modal backdrop.
   */
  "modal-popover-underlay": 10015,
  /** Portaled pickers / menus opened from inside a modal (must sit above z-modal). */
  "modal-popover": 10020,
  /** Skip-to-content link when focused — keyboard escape hatch above modals. */
  skip: 10050,
} as const;

export type ZLayerName = keyof typeof Z_LAYERS;
