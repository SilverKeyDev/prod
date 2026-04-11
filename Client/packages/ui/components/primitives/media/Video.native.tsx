import React, { forwardRef, useMemo } from "react";

import { ResizeMode as ExpoResizeMode, Video as ExpoVideo } from "expo-av";
import type { StyleProp, ViewStyle } from "react-native";

export type VideoProps = {
  source?: { uri?: string };
  style?: StyleProp<ViewStyle>;
  className?: string;
  /** "cover" | "contain" | "stretch" - maps to expo-av ResizeMode. */
  resizeMode?: "cover" | "contain" | "stretch";
  /** Control playback; defaults to true for backwards-compat. */
  shouldPlay?: boolean;
  /** Looping; defaults to true. */
  isLooping?: boolean;
  /** Mute audio. Defaults to true (autoplay-safe). */
  isMuted?: boolean;
  /** HLS and standard video URLs are supported by the native player. */
  children?: React.ReactNode;
};

const RESIZE_MODE_MAP: Record<
  NonNullable<VideoProps["resizeMode"]>,
  ExpoResizeMode
> = {
  cover: ExpoResizeMode.COVER,
  contain: ExpoResizeMode.CONTAIN,
  stretch: ExpoResizeMode.STRETCH,
};

/**
 * Base Video primitive - expo-av Video for React Native.
 * Supports HLS and standard video URLs via native player.
 * Web uses <video> (Video.web.tsx).
 */
const Video = forwardRef<ExpoVideo, VideoProps>(function Video(
  {
    source,
    style,
    resizeMode = "cover",
    shouldPlay = true,
    isLooping = true,
    isMuted = true,
  },
  ref,
) {
  const uri = source?.uri;
  const videoSource = useMemo(() => (uri ? { uri } : undefined), [uri]);

  if (!videoSource) {
    return null;
  }

  return (
    <ExpoVideo
      ref={ref}
      source={videoSource}
      style={style}
      resizeMode={RESIZE_MODE_MAP[resizeMode]}
      useNativeControls={false}
      isLooping={isLooping}
      shouldPlay={shouldPlay}
      isMuted={isMuted}
    />
  );
});

export default Video;
