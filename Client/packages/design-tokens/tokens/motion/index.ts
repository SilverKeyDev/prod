/**
 * Motion tokens for Tailwind `transitionDuration` / `transitionTimingFunction` extensions.
 * Values live in motion.theme.json so the Metro CJS preset can require the same file.
 */
import motionTheme from "./motion.theme.json";

export const motionDuration = motionTheme.transitionDuration;
export const motionEasing = motionTheme.transitionTimingFunction;
