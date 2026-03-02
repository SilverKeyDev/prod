import type { MediaItem } from "@/features/feed/types/feed";

export type MediaCarouselRef = {
  scrollToSlide: (index: number) => void;
};

export type MediaCarouselProps = {
  media: MediaItem[];
  isReelActive: boolean;
  isVisible: boolean;
  onSlideChange?: (index: number) => void;
  onGestureLock?: (active: boolean) => void;
  gestureLockedToHorizontal?: boolean;
  onVideoPlayingChange?: (playing: boolean) => void;
  hideSlideIndicator?: boolean;
  onTap?: () => void;
  className?: string;
};
