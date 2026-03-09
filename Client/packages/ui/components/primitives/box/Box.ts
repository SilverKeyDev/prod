/**
 * Barrel so that "./Box" resolves for TypeScript/ESLint.
 * Bundlers still pick the platform file:
 * - Box.native.tsx for React Native
 * - Box.web.tsx for web
 */
export { default } from "./Box.web";
export * from "./Box.web";
