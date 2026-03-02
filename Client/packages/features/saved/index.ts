/**
 * Saved feature barrel. Export public API for apps (e.g. mobile App stack).
 * Native-only screens are in ./native.
 */
export { SavedFeature } from "./components/SavedFeature";
export type { PropertyData, RawHomeData } from "./types/savedHomeMappers";
export { mapHomeUniversalToSavedHome } from "./types/savedHomeMappers";
export {
  convertToFavoriteHome,
  findSavedHomeByIdOrAddress,
  isProcessedSavedHomeList,
} from "./types/savedHomeUtils";
