/**
 * Web Headless UI re-exports (explicit .web so Vitest/jsdom does not resolve native DialogImpl).
 */
export { Description, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "./DialogImpl.web";
export { Transition } from "./TransitionImpl.web";
