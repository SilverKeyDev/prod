import { log, LOG_CATEGORIES } from "logger";

import {
  createBlob,
  getDocument,
  getNavigator,
  getWindow,
} from "packages/utils/core/platform";

/** Set by app init (e.g. ReelsView) to avoid utils importing config. */
let baseUrlGetter: (() => string) | null = null;

export function setBaseUrlGetter(getter: () => string): void {
  baseUrlGetter = getter;
}

const FLUSH_INTERVAL_MS = 10_000;
const QUEUE_BATCH_SIZE = 5;

export type FeedAnalyticsEvent = {
  type:
    | "dwell"
    | "completion"
    | "play"
    | "pause"
    | "share"
    | "reels_to_map_click"
    | "tour_click"
    | "save_click";
  listingId: string;
  impressionId?: string;
  durationMs?: number;
  watchedPercent?: number;
  timestamp: number;
};

const queue: FeedAnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function startFlushTimer(): void {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    flush();
  }, FLUSH_INTERVAL_MS);
}

function stopFlushTimer(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

/** Sends batch via sendBeacon (best-effort, no retry). On failure, events are only logged. */
function sendBatch(events: FeedAnalyticsEvent[]): void {
  if (events.length === 0) return;
  const base = baseUrlGetter ? baseUrlGetter() : "";
  const path = "/api/v1/analytics/feed/batch";
  const url = base ? `${base.replace(/\/$/, "")}${path}` : path;
  const payload = createBlob([JSON.stringify({ events })], {
    type: "application/json",
  });
  const nav = getNavigator();
  const sent = nav?.sendBeacon?.(url, payload) ?? false;
  if (!sent) {
    log.warn(LOG_CATEGORIES.FEED, "Feed analytics sendBeacon failed", {
      eventCount: events.length,
    });
    events.forEach((ev) => {
      log.info(LOG_CATEGORIES.FEED, "Feed analytics event (fallback)", ev);
    });
  }
}

export function flush(): void {
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  sendBatch(batch);
  if (queue.length === 0) {
    stopFlushTimer();
  }
}

export function enqueue(event: Omit<FeedAnalyticsEvent, "timestamp">): void {
  queue.push({ ...event, timestamp: Date.now() });
  startFlushTimer();
  if (queue.length >= QUEUE_BATCH_SIZE) {
    flush();
  }
}

let beaconInitialized = false;

/** Call from app init - flushes on tab hide and page unload. Safe to call multiple times. */
export function initBeaconFlush(): void {
  const win = getWindow();
  const doc = getDocument();
  if (!win || !doc || beaconInitialized) return;
  beaconInitialized = true;
  win.addEventListener("visibilitychange", () => {
    if (doc.visibilityState === "hidden") flush();
  });
  win.addEventListener("pagehide", () => flush());
  win.addEventListener("beforeunload", () => flush());
}
