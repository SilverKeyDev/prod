import type { ViewportPolygonPoint } from "packages/types/domain/api";
import { getSessionStorage } from "packages/utils/core/storage/platformStorage";

/** sessionStorage key for a search started on a public agent page (SIL-291). */
export const PENDING_PUBLIC_SEARCH_KEY = "silverkey_pending_public_search_v1";

/**
 * Location picked in the public agent page search bar, restored by the
 * dashboard search after handoff — immediately for signed-in viewers, or
 * after signup/onboarding for anonymous viewers (sessionStorage survives the
 * auth flow in the same tab, like the pending connect intent).
 *
 * `overlay` is the search-area map overlay (`IsochroneData`); typed loosely
 * here because utils sit below the feature that owns the type.
 */
export type PendingPublicSearch = {
  label: string;
  ring: ViewportPolygonPoint[] | null;
  overlay: unknown | null;
};

export function setPendingPublicSearch(pending: PendingPublicSearch): void {
  const label = pending.label.trim();
  if (!label) return;
  try {
    getSessionStorage().setItem(
      PENDING_PUBLIC_SEARCH_KEY,
      JSON.stringify({ ...pending, label })
    );
  } catch {
    /* storage unavailable — handoff simply loses the query */
  }
}

/** Read and clear the pending search (one-shot consume). */
export function takePendingPublicSearch(): PendingPublicSearch | null {
  try {
    const raw = getSessionStorage().getItem(PENDING_PUBLIC_SEARCH_KEY);
    if (!raw) return null;
    getSessionStorage().removeItem(PENDING_PUBLIC_SEARCH_KEY);
    const parsed = JSON.parse(raw) as Partial<PendingPublicSearch>;
    if (typeof parsed.label !== "string" || !parsed.label.trim()) return null;
    return {
      label: parsed.label,
      ring: Array.isArray(parsed.ring) ? parsed.ring : null,
      overlay: parsed.overlay ?? null,
    };
  } catch {
    return null;
  }
}

export function clearPendingPublicSearch(): void {
  try {
    getSessionStorage().removeItem(PENDING_PUBLIC_SEARCH_KEY);
  } catch {
    /* ignore */
  }
}
