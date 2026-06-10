import { useCallback, useEffect, useRef } from "react";

import Hls from "hls.js";

import { getNavigator } from "packages/utils/core/platform";

import type { UseHlsVideoParams } from "./useHlsVideoTypes";

const ACTIVE_BUFFER_TARGET = 10; // 8-12 seconds per spec
const NEXT_BUFFER_TARGET = 3; // hook only, 3 seconds

function isHlsUrl(url: string): boolean {
  return url.includes(".m3u8") || url.includes("m3u8");
}

function isLowDataMode(): boolean {
  const nav = getNavigator();
  if (!nav) return false;
  return (nav as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
}

/**
 * Web: encapsulates HLS create/destroy, event handlers, buffer targets.
 * Max simultaneous HLS: 2 (active + next). Active buffer: 8-12s. Next: 3s.
 */
export function useHlsVideo({
  videoRef,
  url,
  isActive,
  isNext,
  enabled,
  onAttached,
  onError,
  onBuffering,
}: UseHlsVideoParams) {
  const videoElRef = videoRef as React.RefObject<HTMLVideoElement | null>;
  const hlsRef = useRef<Hls | null>(null);

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!videoElRef.current || !url || !enabled || isLowDataMode()) {
      destroyHls();
      if (videoElRef.current) {
        videoElRef.current.src = "";
        videoElRef.current.load();
      }
      return destroyHls;
    }

    const video = videoElRef.current;

    if (isHlsUrl(url)) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: isActive ? ACTIVE_BUFFER_TARGET : NEXT_BUFFER_TARGET,
          maxMaxBufferLength: 30,
        });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          onAttached?.();
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            onError?.();
            destroyHls();
          }
        });
        hls.on(Hls.Events.BUFFER_APPENDING, () => {
          onBuffering?.(false);
        });
        hls.on(Hls.Events.BUFFER_EOS, () => {
          onBuffering?.(false);
        });
        return destroyHls;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.addEventListener("loadeddata", () => onAttached?.());
        video.addEventListener("error", () => onError?.());
        return () => {
          video.src = "";
          video.load();
        };
      }
    } else {
      video.src = url;
      video.addEventListener("loadeddata", () => onAttached?.());
      video.addEventListener("error", () => onError?.());
      return () => {
        video.src = "";
        video.load();
      };
    }

    return destroyHls;
  }, [url, enabled, isActive, isNext, videoElRef, onAttached, onError, onBuffering, destroyHls]);

  return { destroyHls };
}
