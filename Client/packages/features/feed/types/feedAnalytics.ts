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
