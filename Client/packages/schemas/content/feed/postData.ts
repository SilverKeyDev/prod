/**
 * Post data for SilverKey-style reel feed (mixed-media carousel per row).
 * Callers can map from FeedListing, e.g. videoUrl, images ?? [], and a description.
 */
export interface PostData {
  id: string;
  videoUrl?: string;
  imageUrls: string[];
  description: string;
}
