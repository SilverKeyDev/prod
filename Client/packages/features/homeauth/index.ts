/**
 * Homeauth feature barrel. Export public API for apps (e.g. mobile Auth stack).
 * Avoids apps importing feature internals (components/..., hooks/...).
 * Native-only screens are in ./native.
 */
export type { HomeFeatureComponent, HomeFeatureProps } from "./components/homepage";
export { HomeFeature } from "./components/homepage";
export { runAuthBootstrap } from "./hooks/data/authBootstrap";
export {
  useActiveWorkspace,
  useAllowedWorkspaces,
  useIsAgent,
  useSetActiveWorkspace,
} from "packages/hooks/store";
