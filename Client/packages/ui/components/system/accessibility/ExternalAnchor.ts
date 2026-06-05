/**
 * Barrel so "./ExternalAnchor" resolves for TypeScript/ESLint.
 * Bundlers pick ExternalAnchor.native / ExternalAnchor.web per platform.
 */
export type { ExternalAnchorProps } from "./ExternalAnchor.types";
export { ExternalAnchor } from "./ExternalAnchor.web";
