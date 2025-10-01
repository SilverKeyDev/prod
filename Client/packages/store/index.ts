export { useUIStore } from "./ui.slice";
export { useSessionStore } from "./session.slice";
export { useAuthStore } from "./auth.slice";
export { useFeatureFlagsStore } from "./featureFlags.slice";
export { useFiltersStore, toQueryParams } from "./filters.slice";
export { useReportsStore } from "./reports.slice";
export { useSavedHomesStore } from "./savedHomes.slice";
export { useUserStore } from "./user.slice";
export { useDocumentsStore } from "./documents.slice";
export { useNegotiationStore } from "./negotiation.slice";
export { useGoogleMapsStore } from "./googleMaps.slice";
export { useGoogleCalendarStore } from "./googleCalendar.slice";
export { usePlaidStore } from "./plaid.slice";

// Consolidated search store (recommended for new code)
export {
  useConsolidatedSearchStore,
  toConsolidatedQueryParams,
  selectSearchData,
  selectUIState,
  selectFavorites,
  selectToasts,
} from "./search";

// Selector helpers with safe narrowing
export const selectIsAuthenticated = (s: unknown): boolean =>
  !!(
    s &&
    typeof s === "object" &&
    "isAuthenticated" in s &&
    (s as Record<string, unknown>).isAuthenticated
  );

export const selectAuthReady = (s: unknown): boolean =>
  !!(
    s &&
    typeof s === "object" &&
    "authReady" in s &&
    (s as Record<string, unknown>).authReady
  );

export const selectUserMeta = (s: unknown): unknown =>
  s && typeof s === "object" && "userMeta" in s
    ? (s as Record<string, unknown>).userMeta
    : undefined;

export const selectFeatureFlags = (s: unknown): Record<string, boolean> =>
  s &&
  typeof s === "object" &&
  "flags" in s &&
  typeof (s as Record<string, unknown>).flags === "object"
    ? ((s as Record<string, unknown>).flags as Record<string, boolean>)
    : {};
