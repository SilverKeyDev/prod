/**
 * Barrel so that "./Image" resolves for TypeScript/ESLint.
 * Bundlers still pick the platform file:
 * - Image.native.tsx for React Native
 * - Image.web.tsx for web
 */
export { default } from "./Image.web";
export * from "./Image.web";
