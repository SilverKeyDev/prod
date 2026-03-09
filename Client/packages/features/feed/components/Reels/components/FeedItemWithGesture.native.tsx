import { useCallback, useEffect, useRef, useState } from "react";

import IconButton from "@ui/button/IconButton";
import { Icon } from "@ui/icons";
import { Pressable, StyleSheet, View } from "react-native";

import { color } from "packages/design-tokens";
import { useFeedReelsContext } from "packages/features/feed/hooks/feedReels/useFeedReelsContext";
import { useFeedGestureTrap } from "packages/hooks/ui";
import { useFeedStore } from "packages/store";
import { Box, Text } from "packages/ui/components/primitives";
import { formatCompactNumber } from "packages/utils";

import type { MediaCarouselRef } from "@/features/feed/components/carousel/MediaCarousel";
import { MediaCarousel } from "@/features/feed/components/carousel/MediaCarousel";
import type { FeedListing } from "@/features/feed/types/feed";
import { getDisplayStatsForListingId } from "@/features/feed/utils/feedDisplayStats";

export type FeedItemWithGestureProps = {
  item: FeedListing & {
    media: NonNullable<FeedListing["media"]>;
  };
  index: number;
};

export function FeedItemWithGesture({ item, index }: FeedItemWithGestureProps) {
  const {
    activeIndex,
    likedIds,
    likesByHomeId,
    slideIndexByReelIndex,
    isHorizontalGestureActive,
    setCommentsSheetListingId,
    setMoreSheetListingId,
    setIsHorizontalGestureActive,
    handleLike,
    handleTogglePlayPause,
    handleReportSlideChange,
    handleReportVideoPlaying,
  } = useFeedReelsContext();

  const isReelActive = index === activeIndex;
  const isVisible = Math.abs(index - activeIndex) <= 1;

  const apiLikeEntry = likesByHomeId?.[item.id];
  const isLiked = apiLikeEntry?.isLikedByMe ?? likedIds.has(item.id);
  const stats = getDisplayStatsForListingId(item.id);
  const displayLikes = apiLikeEntry
    ? apiLikeEntry.count
    : Math.max(0, stats.likes + (isLiked ? 1 : 0));
  const displayComments = stats.comments;

  const currentSlideIndex = slideIndexByReelIndex[index] ?? 0;
  const totalSlides = item.media?.length ?? 0;

  const onLike = useCallback(() => handleLike(item.id), [handleLike, item.id]);
  const onComment = useCallback(
    () => setCommentsSheetListingId(item.id),
    [setCommentsSheetListingId, item.id]
  );
  const onMore = useCallback(
    () => setMoreSheetListingId(item.id),
    [setMoreSheetListingId, item.id]
  );

  const mediaCarouselRef = useRef<MediaCarouselRef>(null);

  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const heartBurstTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDoubleTap = useCallback(() => {
    onLike();
    setShowHeartBurst(true);
    if (heartBurstTimeoutRef.current) clearTimeout(heartBurstTimeoutRef.current);
    heartBurstTimeoutRef.current = setTimeout(() => {
      setShowHeartBurst(false);
      heartBurstTimeoutRef.current = null;
    }, 600);
  }, [onLike]);

  useEffect(() => {
    return () => {
      if (heartBurstTimeoutRef.current) clearTimeout(heartBurstTimeoutRef.current);
    };
  }, []);

  const { onTap } = useFeedGestureTrap({
    onSingleTap: handleTogglePlayPause,
    onDoubleTap: handleDoubleTap,
  });

  const userHasUnmuted = useFeedStore((s) => s.userHasUnmuted);
  const setUserHasUnmuted = useFeedStore((s) => s.setUserHasUnmuted);

  return (
    <View style={styles.container}>
      <View style={styles.media}>
        <MediaCarousel
          ref={mediaCarouselRef}
          media={item.media}
          isReelActive={isReelActive}
          isVisible={isVisible}
          hideSlideIndicator
          onGestureLock={setIsHorizontalGestureActive}
          gestureLockedToHorizontal={isHorizontalGestureActive}
          onTap={onTap}
          onSlideChange={(slideIndex) => handleReportSlideChange(index, slideIndex)}
          onVideoPlayingChange={(playing) => handleReportVideoPlaying(index, playing)}
        />

        {showHeartBurst && (
          <View style={styles.heartBurst} pointerEvents="none">
            <Icon name="heart" size={96} color={color("rose.DEFAULT")} />
          </View>
        )}

        <View style={styles.overlay} pointerEvents="box-none">
          <View style={styles.bottomLeft} pointerEvents="box-none">
            <Text className="text-base font-semibold text-white" numberOfLines={1}>
              {item.price != null ? `$${item.price.toLocaleString()}` : " "}
            </Text>
            <Text className="text-sm text-white/90" numberOfLines={1}>
              {`${item.city ?? ""}${item.city && item.state ? ", " : ""}${item.state ?? ""}`.trim() ||
                " "}
            </Text>
            {Array.isArray(item.features) && item.features.length > 0 && (
              <Text className="text-xs text-white/80" numberOfLines={2}>
                {item.features.slice(0, 3).join(" · ")}
              </Text>
            )}
          </View>

          <View style={styles.actionStack} pointerEvents="box-none">
            <Box className="items-center">
              <IconButton
                variant="ghost"
                rounded="full"
                icon={
                  <Icon
                    name="heart"
                    size={20}
                    color={isLiked ? color("rose.DEFAULT") : color("neutral.50")}
                  />
                }
                label="Like"
                onPress={onLike}
              />
              <Text className="text-xs text-white">{formatCompactNumber(displayLikes)}</Text>
            </Box>

            <Box className="items-center">
              <IconButton
                variant="ghost"
                rounded="full"
                iconName="message-circle"
                label="Comment"
                onPress={onComment}
              />
              <Text className="text-xs text-white">{formatCompactNumber(displayComments)}</Text>
            </Box>

            <Box className="items-center">
              <IconButton
                variant="ghost"
                rounded="full"
                iconName={userHasUnmuted ? "volume-2" : "volume-x"}
                label="Mute or unmute"
                onPress={() => setUserHasUnmuted(!userHasUnmuted)}
              />
            </Box>

            <Box className="items-center">
              <IconButton
                variant="ghost"
                rounded="full"
                iconName="more-horizontal"
                label="More"
                onPress={onMore}
              />
            </Box>

            {totalSlides > 1 && (
              <View style={styles.slideDots} pointerEvents="box-none">
                {Array.from({ length: totalSlides }, (_, i) => (
                  <Pressable
                    key={i}
                    onPress={() => mediaCarouselRef.current?.scrollToSlide(i)}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          i === currentSlideIndex
                            ? "rgba(255,255,255,0.9)"
                            : "rgba(255,255,255,0.4)",
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: color("neutral.900"),
  },
  media: {
    flex: 1,
    width: "100%",
  },
  heartBurst: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    paddingHorizontal: 12,
    paddingBottom: 16,
    justifyContent: "flex-end",
  },
  bottomLeft: {
    maxWidth: "72%",
  },
  actionStack: {
    position: "absolute",
    right: 8,
    bottom: 18,
    alignItems: "center",
    gap: 14,
  },
  slideDots: {
    position: "absolute",
    left: -70,
    bottom: 0,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
});
