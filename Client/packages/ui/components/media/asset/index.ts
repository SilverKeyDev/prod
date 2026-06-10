/**
 * Unified asset exports for cross-platform usage.
 *
 * On web: Exports URIs that can be used directly in img src
 * On native: Exports sources that can be used in React Native Image components
 */

// Re-export logo assets with consistent naming
export { LOGO_URI as LOGO, MINI_LOGO_URI as MINI_LOGO } from "./logoSource";

// Keep legacy exports for backward compatibility
export * from "./logoSource";
