import { useAuthStore } from "packages/features/homeauth/store";
import { useSearchContextStore } from "packages/features/search/store/searchContext.slice";
import { setPendingPublicSearch } from "packages/utils/growth/agent";

/**
 * Imperative auth read for the search API layer (SIL-291), which runs outside
 * React and cannot use hook selectors. Anonymous viewers using the search bar
 * on public agent pages are routed to the unauthenticated
 * `/api/v1/public/search/*` area lookups.
 */
export function isAnonymousViewerNow(): boolean {
  return !useAuthStore.getState().isAuthenticated;
}

/**
 * Snapshot the location just picked in the public agent page search bar
 * (SIL-291) so the dashboard search can restore and run it after handoff —
 * read imperatively because the bar's `onSearch` fires before React re-renders
 * subscribed selectors.
 */
export function stashPendingPublicSearchFromContext(): void {
  const s = useSearchContextStore.getState();
  const label = (s.locationPlaceLabel ?? s.locationBarDraft ?? "").trim();
  if (!label) return;
  setPendingPublicSearch({
    label,
    ring: s.locationPlaceViewportRing,
    overlay: s.locationSearchOverlayData,
  });
}
