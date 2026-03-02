/**
 * Homeauth feature barrel. Export public API for apps (e.g. mobile Auth stack).
 * Avoids apps importing feature internals (components/..., hooks/...).
 * Native-only screens are in ./native.
 */
export { GoogleSignInButton } from "./components/auth";
export { default as RippleBackground } from "./components/homepage/RippleBackground.web";
export { runAuthBootstrap } from "./hooks/data/authBootstrap";
export type { ChecklistType, UseChecklistDataReturn } from "./hooks/data/useChecklistData";
export { useChecklistData } from "./hooks/data/useChecklistData";
export { useIsAgent } from "./hooks/store/useIsAgent";
