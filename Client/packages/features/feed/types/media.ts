/**
 * Unified media item for reel slideshow (video or image).
 * Used by the adapter to normalize FeedListing into media[].
 */
export type MediaItem = {
  type: "video" | "image";
  src: string;
  /** Poster/thumbnail for video (e.g. thumbnailUrl) */
  poster?: string;
  /** Stable key for list reconciliation */
  id?: string;
};
