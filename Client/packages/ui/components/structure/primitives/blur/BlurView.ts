/**
 * Barrel so "./BlurView" resolves for TypeScript and madge. Bundlers pick BlurView.web / BlurView.native.
 */
export { default } from "./BlurView.web";
export * from "./BlurView.web";
