import type { FeedListing } from "./feed";
import type { MediaItem } from "./media";

export type FeedListingWithMedia = FeedListing & { media: MediaItem[] };
