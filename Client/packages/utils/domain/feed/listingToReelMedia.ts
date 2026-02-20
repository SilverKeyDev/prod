import type {
  FeedListing,
  MediaItem,
} from "packages/schemas/content/feed/feed";

import { DEFAULT_PLACEHOLDER_IMAGE } from "./placeholderAssets";

const FALLBACK_IMAGE = DEFAULT_PLACEHOLDER_IMAGE;

export type FeedListingWithMedia = FeedListing & { media: MediaItem[] };

/**
 * Transforms a FeedListing into a reel item with normalized media[].
 * Ensures media.length >= 1 (primary video first, then images; fallback to thumbnail or dummy).
 */
function buildVideoItems(listing: FeedListing, listingId: string): MediaItem[] {
  const items: MediaItem[] = [];
  if (listing.videoUrl) {
    items.push({
      type: "video",
      src: listing.videoUrl,
      poster: listing.thumbnailUrl,
      id: `${listingId}-video-0`,
    });
  }
  const extraVideos = listing.videoUrls ?? [];
  extraVideos.forEach((src, i) => {
    items.push({
      type: "video",
      src,
      poster: listing.thumbnailUrl,
      id: `${listingId}-video-${i + 1}`,
    });
  });
  return items;
}

function buildImageItems(listing: FeedListing, listingId: string): MediaItem[] {
  const images = listing.images ?? [];
  return images.map((src, i) => ({
    type: "image" as const,
    src,
    id: `${listingId}-img-${i}`,
  }));
}

export function listingToReelMedia(listing: FeedListing): FeedListingWithMedia {
  const media: MediaItem[] = [];
  const listingId = listing.id;
  const videoItems = buildVideoItems(listing, listingId);
  const imageItems = buildImageItems(listing, listingId);
  const order = listing.mediaOrder ?? "videoFirst";

  if (order === "imagesFirst") {
    media.push(...imageItems, ...videoItems);
  } else {
    media.push(...videoItems, ...imageItems);
  }

  if (media.length === 0) {
    media.push({
      type: "image",
      src: listing.thumbnailUrl || FALLBACK_IMAGE,
      id: `${listingId}-fallback`,
    });
  }

  return { ...listing, media };
}
