/**
 * Barrel so that "./Input" resolves for TypeScript/ESLint.
 * Bundlers still pick the platform file:
 * - Input.native.tsx for React Native
 * - Input.web.tsx for web
 */
export { default } from "./Input.web";
export * from "./Input.web";
