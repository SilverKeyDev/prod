import { useCallback, useEffect, useRef, useState } from "react";

import { useHlsVideo } from "packages/hooks/ui";
import { SEARCH_VIEW_MODE_CHANGED_EVENT } from "packages/store";
import { useFeedStore } from "packages/store";
import { Image, Video } from "packages/ui/components/primitives";
import { getDocument, getNavigator, getWindow } from "packages/utils";

import type { FeedListing } from "@/features/feed/types/feed";
import { createImpressionId, logCompletionRate, logDwellTime } from "@/features/feed/utils";

import { FeedItemSkeleton } from "./FeedItemSkeleton";
import { FeedPosterPlaceholder } from "./FeedPosterPlaceholder";

type VideoItemProps = {
  item: FeedListing;
  index: number;
  activeIndex: number;
  isVisible: boolean;
  autoplay?: boolean;
  onRetry?: () => void;
};

/** Default muted per autoplay policy; unmuted only when user taps volume toggle */
function useVideoMuted(index: number, activeIndex: number): boolean {
  const userHasUnmuted = useFeedStore((s) => s.userHasUnmuted);
  const isActive = index === activeIndex;
  return !(userHasUnmuted && isActive);
}

function isLowDataMode(): boolean {
  const nav = getNavigator();
  if (!nav) return false;
  return (nav as { connection?: { saveData?: boolean } }).connection?.saveData === true;
}

export function VideoItem({
  item,
  index,
  activeIndex,
  isVisible,
  autoplay = true,
  onRetry: _onRetry,
}: VideoItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isLoading, setIsLoading] = useState(!!item.videoUrl);
  const [hasError, setHasError] = useState(false);
  const muted = useVideoMuted(index, activeIndex);
  const userPaused = useFeedStore((s) => s.userPaused);
  const setUserPaused = useFeedStore((s) => s.setUserPaused);
  const isActive = index === activeIndex;
  const isOnDeck = index === activeIndex + 1;
  const shouldLoadVideo = isActive || isOnDeck;
  const shouldDestroy = !isVisible || Math.abs(index - activeIndex) > 1;
  const impressionIdRef = useRef<string | null>(null);
  const dwellAccumulatorRef = useRef(0);
  const dwellIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasVideo = Boolean(item.videoUrl);
  const hasSongAudio = Boolean(item.audioSongUrl) && !hasVideo;

  const onAttached = useCallback(() => setIsLoading(false), []);
  const onError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
  }, []);

  useHlsVideo({
    videoRef,
    url: item.videoUrl,
    isActive,
    isNext: isOnDeck,
    enabled: hasVideo && !shouldDestroy && shouldLoadVideo && !isLowDataMode(),
    onAttached,
    onError,
  });

  const shouldPlay = index === activeIndex && autoplay && !userPaused;

  useEffect(() => {
    if (videoRef.current && isVisible) {
      const video = videoRef.current;
      if (shouldPlay) {
        void video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
    if (audioRef.current && hasSongAudio) {
      const audio = audioRef.current;
      if (shouldPlay && !muted) {
        void audio.play().catch(() => {});
      } else {
        audio.pause();
      }
    }
  }, [index, activeIndex, isVisible, autoplay, muted, hasSongAudio, userPaused, shouldPlay]);

  useEffect(() => {
    const doc = getDocument();
    if (!doc) return;
    const handler = () => {
      if (doc.hidden) {
        videoRef.current?.pause();
        audioRef.current?.pause();
      }
      if (!doc.hidden && hasError && isActive && isVisible) {
        setHasError(false);
      }
    };
    doc.addEventListener("visibilitychange", handler);
    return () => doc.removeEventListener("visibilitychange", handler);
  }, [hasError, isActive, isVisible]);

  useEffect(() => {
    const win = getWindow();
    if (!win) return;
    const handler = () => {
      videoRef.current?.pause();
      if (videoRef.current) videoRef.current.muted = true;
      audioRef.current?.pause();
    };
    win.addEventListener(SEARCH_VIEW_MODE_CHANGED_EVENT, handler);
    return () => win.removeEventListener(SEARCH_VIEW_MODE_CHANGED_EVENT, handler);
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const handler = () => {
      const video = videoRef.current;
      const audio = audioRef.current;
      if (video) {
        if (video.paused) {
          setUserPaused(false);
          void video.play().catch(() => {});
        } else {
          video.pause();
          setUserPaused(true);
        }
      } else if (audio) {
        if (audio.paused) {
          setUserPaused(false);
          void audio.play().catch(() => {});
        } else {
          audio.pause();
          setUserPaused(true);
        }
      }
    };
    const win = getWindow();
    if (win) win.addEventListener("reels-space-press", handler);
    return () => {
      if (win) win.removeEventListener("reels-space-press", handler);
    };
  }, [isActive, setUserPaused]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
    if (audioRef.current) {
      audioRef.current.muted = muted;
      if (muted) {
        audioRef.current.pause();
      } else if (isActive && autoplay && isVisible && !userPaused) {
        void audioRef.current.play().catch(() => {});
      }
    }
  }, [muted, isActive, autoplay, isVisible, userPaused]);

  // Dwell time: timer runs when playing + visible + tab active; 250ms threshold; accumulate
  useEffect(() => {
    const isActive = index === activeIndex;
    const mediaEl = videoRef.current ?? audioRef.current;
    if (!isActive) {
      if (dwellIntervalRef.current) {
        clearInterval(dwellIntervalRef.current);
        dwellIntervalRef.current = null;
      }
      const accumulated = dwellAccumulatorRef.current;
      const media = videoRef.current ?? audioRef.current;
      if (accumulated > 0 && impressionIdRef.current) {
        logDwellTime(item.id, accumulated, impressionIdRef.current);
        if (media && media.duration > 0) {
          const watchedPercent = Math.min(100, (accumulated / 1000 / media.duration) * 100);
          if (watchedPercent >= 80) {
            logCompletionRate(item.id, watchedPercent, impressionIdRef.current);
          }
        }
        dwellAccumulatorRef.current = 0;
        impressionIdRef.current = null;
      }
      return;
    }

    if (!isVisible || !mediaEl) return;

    impressionIdRef.current ??= createImpressionId(item.id, index);

    const doc = getDocument();
    const tick = () => {
      const el = videoRef.current ?? audioRef.current;
      if (
        el &&
        doc?.visibilityState === "visible" &&
        !el.paused &&
        !(el as HTMLMediaElement).ended
      ) {
        dwellAccumulatorRef.current += 100;
      }
    };

    dwellIntervalRef.current = setInterval(tick, 100);
    return () => {
      if (dwellIntervalRef.current) {
        clearInterval(dwellIntervalRef.current);
        dwellIntervalRef.current = null;
      }
    };
  }, [index, activeIndex, isVisible, item.id]);

  if (hasError) {
    return (
      <div
        className="relative h-full min-h-0 w-full snap-start overflow-hidden"
        style={{ scrollSnapAlign: "start" }}
      >
        <Image
          src={item.thumbnailUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center md:object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
        />
        <div className="absolute inset-0 hidden">
          <FeedPosterPlaceholder />
        </div>
      </div>
    );
  }

  if (isLowDataMode()) {
    return (
      <div
        className="relative h-full min-h-0 w-full snap-start overflow-hidden"
        style={{ scrollSnapAlign: "start" }}
      >
        <Image
          src={item.thumbnailUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center md:object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
        />
        <div className="absolute inset-0 hidden">
          <FeedPosterPlaceholder />
        </div>
      </div>
    );
  }

  if (!shouldLoadVideo && isVisible && hasVideo) {
    return (
      <div
        className="relative h-full min-h-0 w-full snap-start overflow-hidden"
        style={{ scrollSnapAlign: "start" }}
      >
        <Image
          src={item.thumbnailUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center md:object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
        />
        <div className="absolute inset-0 hidden">
          <FeedPosterPlaceholder />
        </div>
      </div>
    );
  }

  if (!hasVideo) {
    const firstImage = item.images?.[0] ?? item.thumbnailUrl;
    return (
      <div
        className="relative h-full min-h-0 w-full snap-start overflow-hidden"
        style={{ scrollSnapAlign: "start" }}
      >
        <Image
          src={firstImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center md:object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextElementSibling?.classList.remove("hidden");
          }}
        />
        <div className="absolute inset-0 hidden">
          <FeedPosterPlaceholder />
        </div>
        {hasSongAudio && item.audioSongUrl && (
          <audio
            ref={audioRef}
            src={item.audioSongUrl}
            loop
            muted={muted}
            playsInline
            className="hidden"
          >
            <track kind="captions" />
          </audio>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative h-full min-h-0 w-full snap-start overflow-hidden"
      style={{ scrollSnapAlign: "start" }}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10">
          <FeedItemSkeleton thumbnailUrl={item.thumbnailUrl} />
        </div>
      )}
      <Video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover object-center md:object-contain"
        playsInline
        muted={muted}
        loop
        poster={item.thumbnailUrl}
        style={{ opacity: isLoading ? 0 : 1 }}
      >
        <track kind="captions" />
      </Video>
    </div>
  );
}
