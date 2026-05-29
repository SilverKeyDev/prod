export { type AgentDashboardState, useAgentDashboardStore } from "./slices/agentDashboard";
export { useFeatureFlagsStore } from "./slices/featureFlags";
export { useGoogleMapsStore } from "./slices/maps";
export { useNotificationStore } from "./slices/notifications";
export { type ReportsState, useReportsStore } from "./slices/reports";
export {
  type DevAppPersonaState,
  type ToastItem,
  type UIState,
  useDevAppPersonaStore,
  useUIStore,
  useViewStore,
  type ViewState,
} from "./slices/ui";
export {
  resetWorkspaceStore,
  useWorkspaceStore,
  type Workspace,
  type WorkspaceState,
} from "./slices/workspace";
export { useGoogleCalendarStore } from "packages/features/calendar/store";
export { useSchedulingStore } from "packages/features/calendar/store";
export { type CompareSessionState, useCompareSessionStore } from "packages/features/compare/store";
export { useDocumentsStore } from "packages/features/documents/store";
export { useFeedStore } from "packages/features/feed/store";
export { useSessionStore } from "packages/features/homeauth/store";
export {
  type AuthState,
  type AuthStatus,
  type LoginResult,
  useAuthStore,
  type UserState,
  useUserStore,
} from "packages/features/homeauth/store";
export {
  type MessagingComposerState,
  useMessagingComposerStore,
} from "packages/features/messaging/store";
export { useNegotiationStore } from "packages/features/negotiate/store";
export { useSavedHomesStore } from "packages/features/saved/store";
export {
  type MapRegionSnapshot,
  type SearchSource,
  toQueryParams,
  useFiltersStore,
  type WebMapCameraSnapshot,
} from "packages/features/search/store";
export {
  SEARCH_VIEW_MODE_CHANGED_EVENT,
  type SearchViewMode,
  useSearchViewStore,
} from "packages/features/search/store";
export {
  type SearchContextAnchor,
  type SearchFilterOverrides,
  useSearchContextStore,
} from "packages/features/search/store";

// Consolidated search store — results, pagination, tabs, favorites, toasts
export {
  selectFavorites,
  selectSearchData,
  selectToasts,
  selectUIState,
  toConsolidatedQueryParams,
  useConsolidatedSearchStore,
} from "packages/features/search/store";

// Selector helpers with safe narrowing
export const selectIsAuthenticated = (s: unknown): boolean =>
  !!(
    s &&
    typeof s === "object" &&
    "isAuthenticated" in s &&
    (s as Record<string, unknown>).isAuthenticated
  );

export const selectAuthReady = (s: unknown): boolean =>
  !!(s && typeof s === "object" && "authReady" in s && (s as Record<string, unknown>).authReady);

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
