import type { ReactNode } from "react";

export type FeedReelsContextValue = {
  activeIndex: number;
  autoplayEnabled: boolean;
  slideIndexByReelIndex: Record<number, number>;
  likedIds: Set<string>;
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
