/**
 * Barrel so that "./Text" resolves for TypeScript/ESLint.
 * Bundlers still pick the platform file:
 * - Text.native.tsx for React Native
 * - Text.web.tsx for web
 */
export { default } from "./Text.web";
export * from "./Text.web";
