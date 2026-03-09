/**
 * Barrel so that "./Video" resolves for TypeScript/ESLint.
 * Bundlers still pick the platform file:
 * - Video.native.tsx for React Native
 * - Video.web.tsx for web
 */
export { default } from "./Video.web";
export * from "./Video.web";
