/**
 * Barrel so that "./ScrollView" resolves for TypeScript/ESLint.
 * Bundlers still pick the platform file:
 * - ScrollView.native.tsx for React Native
 * - ScrollView.web.tsx for web
 */
export { default } from "./ScrollView.web";
export * from "./ScrollView.web";
