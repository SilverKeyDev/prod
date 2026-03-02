import { log, LOG_CATEGORIES } from "packages/logger";

import { enqueue } from "./feedAnalyticsQueue";

/** Interactions under this threshold are discarded as noise (fast scrolling). */
const DWELL_THRESHOLD_MS = 250;

/**
 * Log dwell time per listing (how long user viewed).
 * Events are batched and sent to analytics backend.
 */
export function logDwellTime(listingId: string, durationMs: number, impressionId?: string): void {
  if (durationMs < DWELL_THRESHOLD_MS) return;
  enqueue({
    type: "dwell",
    listingId,
    impressionId,
    durationMs,
  });
  log.info(LOG_CATEGORIES.FEED, "Feed dwell time", {
    listingId,
    durationMs,
    impressionId,
  });
}

/**
 * Log completion rate (did user watch >80% of video).
 * Events are batched and sent to analytics backend.
 */
export function logCompletionRate(
  listingId: string,
  watchedPercent: number,
  impressionId?: string
): void {
  enqueue({
    type: "completion",
    listingId,
    impressionId,
    watchedPercent,
  });
  log.info(LOG_CATEGORIES.FEED, "Feed completion rate", {
    listingId,
    watchedPercent,
    impressionId,
  });
}

/** Generate unique impression ID: listingId + index + randomSuffix (per spec) */
export function createImpressionId(listingId: string, index: number): string {
  const suffix = Math.random().toString(36).slice(2, 11);
  return `${listingId}_${index}_${suffix}`;
}

/**
 * Log mode switch ratio (Map vs Reels preference)
 */
export function logModeSwitchRatio(mapCount: number, reelsCount: number): void {
  log.info(LOG_CATEGORIES.FEED, "Feed mode switch ratio", {
    mapCount,
    reelsCount,
  });
}

/**
 * Log reels_to_map_click (user tapped Map Details)
 */
export function logReelsToMapClick(listingId: string): void {
  enqueue({
    type: "reels_to_map_click",
    listingId,
  });
  log.info(LOG_CATEGORIES.FEED, "Reels to map click", { listingId });
}

/**
 * Log tour_click (user requested tour from feed)
 */
export function logTourClick(listingId: string): void {
  enqueue({
    type: "tour_click",
    listingId,
  });
  log.info(LOG_CATEGORIES.FEED, "Tour click", { listingId });
}
