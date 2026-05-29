import type { MediaItem } from "./media";
export type FeedListingUser = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type FeedListingMusic = {
  title: string;
  artist?: string;
};

export type FeedListingStats = {
  likes: number;
  comments: number;
  shares?: number;
};

/** Single comment on a feed/reels listing (Instagram-style) */
export type FeedComment = {
  id: string;
  user: FeedListingUser;
  text: string;
  /** ISO date string or timestamp for relative time (e.g. "2h", "1d") */
  createdAt: string;
  likes?: number;
};

export type FeedListing = {
  id: string;
  /** Video URL - optional; some items are image-only */
  videoUrl?: string;
  /** Additional video URLs (e.g. for multi-video reels); order after primary video */
  videoUrls?: string[];
  thumbnailUrl: string;
  user: FeedListingUser;
  music?: FeedListingMusic;
  stats: FeedListingStats;
  /** Listing price for Financial Hook (monthly payment badge) */
  price?: number;
  /** Zip code for tax/affordability calculation */
  zipCode?: string;
  /** City for overlay display (e.g. "Austin") */
  city?: string;
  /** State for overlay display (e.g. "TX") */
  state?: string;
  /** Feature tags for overlay (e.g. ["3 bed", "2 bath", "Pool"]) */
  features?: string[];
  /** Images for horizontal carousel within listing */
  images?: string[];
  /** Coordinates for Reels→Map anchor sync */
  lat?: number;
  lng?: number;
  /** Speech audio for video items; plays with video when unmuted */
  audioSpeechUrl?: string;
  /** Song audio for image-only items; plays when no video */
  audioSongUrl?: string;
  /** Normalized media list (video + images). Populated by adapter; always length >= 1 when used in feed. */
  media?: MediaItem[];
  /** Test/override: order of media in adapter output. Default "videoFirst". */
  mediaOrder?: "videoFirst" | "imagesFirst";
};

/** Imperative handle for feed scroll container (keyboard/wheel navigation) */
export type FeedScrollController = {
  currentIndex: number;
  scrollToIndex: (index: number) => void;
  itemCount: number;
};

export type { MediaItem } from "./media";
export type { PostData } from "./postData";
