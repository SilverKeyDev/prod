/**
 * Web-only transition classes. Native uses Moti for animations.
 * Import from transitionClasses - bundler resolves to .web or .native.
 */

export const INPUT_TRANSITION_CLASSES = "transition-all duration-200";
export const BUTTON_TRANSITION_CLASSES =
  "transition-all duration-200 transition-colors duration-200";
export const LABEL_TRANSITION_CLASSES = "transition-colors duration-150";
export const MODAL_TRANSITION_CLASSES = "transition-all duration-200";

export const CARD_TRANSITION_CLASSES = "transition-all duration-200";
export const CARD_TRANSITION_CLASSES_300 = "transition-all duration-300";
export const DROPDOWN_TRANSITION_CLASSES = "transition-all duration-200";
export const MODAL_BACKDROP_TRANSITION_CLASSES = "transition-opacity";
export const MODAL_PANEL_TRANSITION_CLASSES = "transition-all";
export const ICON_TRANSFORM_CLASSES = "transition-transform duration-200";
export const HOVER_BG_CLASSES = "transition-colors duration-150";
export const NO_TRANSITION_CLASSES = "transition-none";

/** Gray hover+active for interactive elements - native tap feedback */
export const HOVER_ACTIVE_GRAY =
  "hover:bg-gray-50 active:bg-gray-100 active:opacity-90";
export const HOVER_ACTIVE_GRAY_STRONG =
  "hover:bg-gray-100 active:bg-gray-200 active:opacity-90";
export const HOVER_ACTIVE_WHITE =
  "hover:bg-neutral-50 active:bg-white active:opacity-90";
