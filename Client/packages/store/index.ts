export { useSessionStore } from "./slices/auth";
export {
  type AuthState,
  type AuthStatus,
  type LoginResult,
  useAuthStore,
} from "./slices/auth";
export { useDocumentsStore } from "./slices/documents";
export { useFeatureFlagsStore } from "./slices/featureFlags";
export { useFeedStore } from "./slices/feed";
export { useGoogleMapsStore } from "./slices/maps";
export { useNegotiationStore } from "./slices/negotiation";
export { useNotificationStore } from "./slices/notifications";
export { useReportsStore } from "./slices/reports";
export { useSavedHomesStore } from "./slices/saved";
export { useGoogleCalendarStore } from "./slices/scheduling";
export { useSchedulingStore } from "./slices/scheduling";
export { toQueryParams, useFiltersStore } from "./slices/search";
export {
  SEARCH_VIEW_MODE_CHANGED_EVENT,
  type SearchViewMode,
  useSearchViewStore,
} from "./slices/search";
export {
  type SearchContextAnchor,
  type SearchFilterOverrides,
  useSearchContextStore,
} from "./slices/search";
export { type ToastItem, type UIState, useUIStore } from "./slices/ui";
export { useViewStore, type ViewState } from "./slices/ui";
export { type UserState, useUserStore } from "./slices/user";

// Consolidated search store (recommended for new code)
export {
  selectFavorites,
  selectSearchData,
  selectToasts,
  selectUIState,
  toConsolidatedQueryParams,
  useConsolidatedSearchStore,
} from "./slices/search";

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
