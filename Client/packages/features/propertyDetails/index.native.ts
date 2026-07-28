/**
 * Native-only exports for mobile app. Do not import from this barrel in the web app.
 *
 * Metro resolves `packages/features/propertyDetails` to this file on iOS/Android, so it
 * *replaces* `index.ts`; members native code imports from the barrel are re-exported here.
 * PropertyDetailsModal has its own `.native` variant, which platform resolution picks up.
 */
export { default as PropertyDetailsModal } from "./components/PropertyDetailsModal";
export { PropertyDetailsScreenNative } from "./components/PropertyDetailsScreen/PropertyDetailsScreen.native";
