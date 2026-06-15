/**
 * Barrel so that "./Button" resolves for TypeScript/ESLint.
 * Bundlers still pick the platform file:
 * - Button.native.tsx for React Native
 * - Button.web.tsx for web
 */
export { default } from "./Button.web";
export * from "./Button.web";
