import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";

import { FlatList, Pressable, useWindowDimensions, View } from "react-native";

import { color } from "packages/design-tokens";
import { Image, Video } from "packages/ui/components/primitives";

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
      hideSlideIndicator: _hideSlideIndicator = false,
      onTap,
    },
    ref
  ) {
    const { width, height } = useWindowDimensions();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const scrollToSlide = (index: number) => {
      flatListRef.current?.scrollToIndex({ index, animated: true });
    };

    useImperativeHandle(ref, () => ({ scrollToSlide }), []);

    const getItemLayout = useCallback(
      (_: unknown, index: number) => ({ length: width, offset: width * index, index }),
      [width]
    );

    const renderItem = useCallback(
      ({ item, index }: { item: (typeof media)[number]; index: number }) => (
        <Pressable style={{ width, height }} onPress={() => onTap?.()}>
          {item.type === "video" ? (
            isVisible && index === selectedIndex && isReelActive ? (
              <Video source={{ uri: item.src }} style={{ width, height }} resizeMode="cover" />
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
      [width, height, isVisible, selectedIndex, isReelActive, onTap]
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
