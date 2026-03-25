import type { FeedDisplayStats } from "packages/features/feed/types/feedDisplayStats";

export type { FeedDisplayStats } from "packages/features/feed/types/feedDisplayStats";

const LIKES_MIN = 10;
const LIKES_MAX = 1000;
const COMMENTS_MIN = 0;
const COMMENTS_MAX = 17;
const SHARES_MIN = 1;
const SHARES_MAX = 29;

/** Simple deterministic hash of a string to a number in [0, 1). */
function hashToUnit(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    const c = id.charCodeAt(i);
    h = (h << 5) - h + c;
    h = h & h;
  }
  return ((h >>> 0) % 1e6) / 1e6;
}

/** Returns deterministic display stats for a listing id (illusion only). */
export function getDisplayStatsForListingId(listingId: string): FeedDisplayStats {
  const u = hashToUnit(listingId);
  const u2 = hashToUnit(listingId + "2");
  const u3 = hashToUnit(listingId + "3");
  const likes = Math.floor(LIKES_MIN + u * (LIKES_MAX - LIKES_MIN + 1));
  const comments = Math.floor(COMMENTS_MIN + u2 * (COMMENTS_MAX - COMMENTS_MIN + 1));
  const shares = Math.floor(SHARES_MIN + u3 * (SHARES_MAX - SHARES_MIN + 1));
  return { likes, comments, shares };
}
