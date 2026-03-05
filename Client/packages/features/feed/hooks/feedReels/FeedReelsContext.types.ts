import type { ReactNode } from "react";

export type FeedLikeEntry = { count: number; isLikedByMe: boolean };

export type FeedReelsContextValue = {
  activeIndex: number;
  autoplayEnabled: boolean;
  slideIndexByReelIndex: Record<number, number>;
  likedIds: Set<string>;
  /** Real likes from API keyed by home_id (item.id). Used for like state when present. */
  likesByHomeId?: Record<string, FeedLikeEntry>;
  isHorizontalGestureActive: boolean;
  setCommentsSheetListingId: (id: string | null) => void;
  setMoreSheetListingId: (id: string | null) => void;
  setIsHorizontalGestureActive: (active: boolean) => void;
  handleLike: (itemId: string) => void;
  handleTogglePlayPause: () => void;
  handleReportSlideChange: (reelIndex: number, slideIndex: number) => void;
  handleReportVideoPlaying: (reelIndex: number, playing: boolean) => void;
};

export type FeedReelsProviderProps = {
  value: FeedReelsContextValue;
  children: ReactNode;
};
