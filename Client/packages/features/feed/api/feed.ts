import { apiGet } from "packages/services/http/compatibility";

import type { FeedListing } from "@/features/feed/types/feed";

export type FeedResponse = {
  items: FeedListing[];
  hasMore: boolean;
  cursor?: string;
};

export type FeedParams = {
  page: number;
  limit: number;
  filtersHash?: string;
  anchor?: { listingId?: string };
  cursor?: string;
};

const DUMMY_AUDIO_SPEECH = "/dummy-audio-speech.wav";
const DUMMY_AUDIO_SONG = "/dummy-audio-song.wav";

/** Mirror of utils/feed/placeholderAssets for dummy feed (config cannot import utils). */
const PLACEHOLDER_IMAGES = [
  "/placeholders/dummy-photo.svg",
  "/placeholders/placeholder-living.svg",
  "/placeholders/placeholder-kitchen.svg",
  "/placeholders/placeholder-exterior.svg",
  "/placeholders/placeholder-bedroom.svg",
  "/placeholders/placeholder-bathroom.svg",
  "/placeholders/placeholder-garden.svg",
];
const PLACEHOLDER_VIDEOS = ["/dummy-video.mp4", "/dummy-video.mp4", "/dummy-video.mp4"];

function getPlaceholderImage(index: number): string {
  return PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
}
function getPlaceholderVideo(index: number): string {
  return PLACEHOLDER_VIDEOS[index % PLACEHOLDER_VIDEOS.length];
}

type ContentVariant = "video_images" | "images_only" | "images_audio" | "images_only_silent";

function createDummyListing(index: number): FeedListing {
  const variants: ContentVariant[] = [
    "video_images",
    "images_only",
    "images_audio",
    "images_only_silent",
    "video_images",
    "images_audio",
    "images_only",
    "video_images",
    "images_only_silent",
    "images_audio",
  ];
  const variant = variants[index % variants.length];

  const img0 = getPlaceholderImage(index);
  const img1 = getPlaceholderImage(index + 1);
  const _img2 = getPlaceholderImage(index + 2);
  const base = {
    id: `dummy-${index}`,
    thumbnailUrl: img0,
    user: { id: "dummy-user", name: "SilverKey", avatarUrl: img1 },
    stats: { likes: index % 3 === 0 ? 12 : 0, comments: index % 5 },
    images: [img0],
  };

  switch (variant) {
    case "video_images":
      return {
        ...base,
        videoUrl: getPlaceholderVideo(index),
        audioSpeechUrl: DUMMY_AUDIO_SPEECH,
        images: [img0, img1],
      };
    case "images_only":
      return { ...base, images: [img0, img1] };
    case "images_audio":
      return {
        ...base,
        audioSongUrl: DUMMY_AUDIO_SONG,
        images: [img0, img1],
      };
    case "images_only_silent":
      return { ...base, images: [img0] };
    default:
      return {
        ...base,
        videoUrl: getPlaceholderVideo(index),
        images: [img0],
      };
  }
}

function buildFeedQueryString(params: FeedParams): string {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));
  if (params.filtersHash) searchParams.set("filtersHash", params.filtersHash);
  if (params.anchor?.listingId) searchParams.set("anchor", params.anchor.listingId);
  if (params.cursor) searchParams.set("cursor", params.cursor);
  return searchParams.toString();
}

/**
 * Feed API - accepts filtersHash, anchor, cursor for SearchContext-driven feed.
 * Uses dummy photo and video from public when API fails or returns empty.
 */
export const feedApi = {
  getFeed: async (params: FeedParams): Promise<FeedResponse> => {
    const { page, limit } = params;
    try {
      const queryString = buildFeedQueryString(params);
      const response = await apiGet<FeedResponse>(`/api/v1/feed?${queryString}`);
      if (response && response.items.length > 0) {
        return response;
      }
    } catch {
      /* fall through to dummy data */
    }
    const items: FeedListing[] = Array.from({ length: limit }, (_, i) =>
      createDummyListing(page * limit + i)
    );
    return { items, hasMore: page < 2 };
  },
};
