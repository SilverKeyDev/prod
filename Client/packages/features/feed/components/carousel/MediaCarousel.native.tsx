import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { FlatList, Pressable, useWindowDimensions, View } from "react-native";

import { color } from "packages/design-tokens";
import { useFeedStore } from "packages/store";
import { Image, Video } from "packages/ui/components/structure/primitives";

import type { MediaCarouselProps, MediaCarouselRef } from "./MediaCarouselTypes";

/**
 * Native: horizontal FlatList carousel; video via Video.native (expo-av when available).
 */
export const MediaCarousel = forwardRef<MediaCarouselRef, MediaCarouselProps>(
  function MediaCarousel(
    {
      media,
      isReelActive,
      isVisible,
      onSlideChange,
      onGestureLock,
      gestureLockedToHorizontal: _gestureLockedToHorizontal = false,
      onVideoPlayingChange,
      hideSlideIndicator: _hideSlideIndicator = false,
      onTap,
    },
    ref
  ) {
    const { width, height } = useWindowDimensions();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const autoplayEnabled = useFeedStore((s) => s.autoplayEnabled);
    const userPaused = useFeedStore((s) => s.userPaused);
    const userHasUnmuted = useFeedStore((s) => s.userHasUnmuted);

    const scrollToSlide = (index: number) => {
      flatListRef.current?.scrollToIndex({ index, animated: true });
    };

    useImperativeHandle(ref, () => ({ scrollToSlide }), []);

    const getItemLayout = useCallback(
      (_: unknown, index: number) => ({ length: width, offset: width * index, index }),
      [width]
    );

    const shouldPlayActive = isReelActive && autoplayEnabled && !userPaused;

    useEffect(() => {
      const active = media[selectedIndex];
      const playing = Boolean(active?.type === "video" && isVisible && shouldPlayActive);
      onVideoPlayingChange?.(playing);
    }, [isVisible, media, onVideoPlayingChange, selectedIndex, shouldPlayActive]);

    const renderItem = useCallback(
      ({ item, index }: { item: (typeof media)[number]; index: number }) => (
        <Pressable style={{ width, height }} onPress={() => onTap?.()}>
          {item.type === "video" ? (
            isVisible && index === selectedIndex && isReelActive ? (
              <Video
                source={{ uri: item.src }}
                style={{ width, height }}
                resizeMode="cover"
                shouldPlay={shouldPlayActive}
                isMuted={!userHasUnmuted}
              />
            ) : (
              <Image
                source={{ uri: item.poster ?? item.src }}
                style={{ width, height }}
                resizeMode="cover"
              />
            )
          ) : (
            <Image source={{ uri: item.src }} style={{ width, height }} resizeMode="cover" />
          )}
        </Pressable>
      ),
      [
        width,
        height,
        isVisible,
        selectedIndex,
        isReelActive,
        onTap,
        shouldPlayActive,
        userHasUnmuted,
      ]
    );

    if (media.length === 0)
      return <View style={{ width, height, backgroundColor: color("neutral.200") }} />;

    return (
      <View style={{ flex: 1, width, height }}>
        <FlatList
          ref={flatListRef}
          data={media}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, i) => item.id ?? String(i)}
          getItemLayout={getItemLayout}
          onScrollBeginDrag={() => onGestureLock?.(true)}
          onScrollEndDrag={() => onGestureLock?.(false)}
          onMomentumScrollEndCapture={() => onGestureLock?.(false)}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setSelectedIndex(idx);
            onSlideChange?.(idx);
          }}
          renderItem={renderItem}
        />
      </View>
    );
  }
);
