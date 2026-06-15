import React, { useCallback, useRef, useState } from "react";

import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { FlatList } from "react-native";

import { IconButton } from "packages/ui";
import { Box, Image, Text } from "packages/ui/components/structure/primitives";
import type { HomeDescription } from "packages/ui/components/surfaces/cards/HomeCard";

import { formatHomePrice } from "./MessagingMessageRowNativeSharedHomes.helpers";

export function MessagingSharedHomeMiniNativeCard({
  homeData,
  subtitle,
  omitBottomMargin = false,
}: {
  homeData: HomeDescription;
  subtitle: string;
  omitBottomMargin?: boolean;
}) {
  const address = homeData.address ?? homeData.description ?? homeData.home_id ?? "";
  const priceStr = formatHomePrice(homeData.price as string | number | undefined);
  const metaParts: string[] = [];
  if (priceStr) metaParts.push(priceStr);
  if (typeof homeData.sqft === "number" && homeData.sqft > 0) {
    metaParts.push(`${homeData.sqft.toLocaleString()} sq ft`);
  }
  if (typeof homeData.bedrooms === "number" || typeof homeData.bathrooms === "number") {
    const beds = homeData.bedrooms ?? "-";
    const baths = homeData.bathrooms ?? "-";
    metaParts.push(`${beds} bd · ${baths} ba`);
  }
  const imageUrl = typeof homeData.image_url === "string" ? homeData.image_url : undefined;
  return (
    <Box
      className={`border-border bg-background-base max-w-full overflow-hidden rounded-lg border ${
        omitBottomMargin ? "" : "mb-2"
      }`}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          className="h-28 w-full rounded-t-lg"
          resizeMode="cover"
          label={address}
        />
      ) : null}
      <Box className="p-3">
        <Text className="text-text-secondary text-xs font-medium">{subtitle}</Text>
        <Text className="text-text-primary mt-1 text-sm font-medium" numberOfLines={2}>
          {address}
        </Text>
        {metaParts.length > 0 ? (
          <Text className="text-text-secondary mt-1 text-xs" numberOfLines={2}>
            {metaParts.join(" · ")}
          </Text>
        ) : null}
      </Box>
    </Box>
  );
}

export function MessagingSharedHomeBundleNative({
  homes,
  cardSubtitle,
}: {
  homes: HomeDescription[];
  cardSubtitle: string;
}) {
  const [slideWidth, setSlideWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<HomeDescription>>(null);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (slideWidth <= 0) return;
      const x = e.nativeEvent.contentOffset.x;
      const next = Math.round(x / slideWidth);
      setActiveIndex(Math.max(0, Math.min(next, homes.length - 1)));
    },
    [slideWidth, homes.length]
  );

  const goTo = useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(0, Math.min(nextIndex, homes.length - 1));
      listRef.current?.scrollToIndex({ index: clamped, animated: true });
      setActiveIndex(clamped);
    },
    [homes.length]
  );

  const showNav = homes.length > 1;

  return (
    <Box
      className="border-border bg-background-base mb-2 max-w-full overflow-hidden rounded-lg border"
      onLayout={(e) => setSlideWidth(e.nativeEvent.layout.width)}
    >
      {slideWidth > 0 ? (
        <Box className="relative w-full" style={{ pointerEvents: "box-none" }}>
          <FlatList
            ref={listRef}
            data={homes}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => item.home_id ?? `bundle-${i}`}
            getItemLayout={(_, i) => ({
              length: slideWidth,
              offset: slideWidth * i,
              index: i,
            })}
            onMomentumScrollEnd={onMomentumScrollEnd}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                listRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                });
              }, 100);
            }}
            renderItem={({ item }) => (
              <Box style={{ width: slideWidth }}>
                <MessagingSharedHomeMiniNativeCard
                  homeData={item}
                  subtitle={cardSubtitle}
                  omitBottomMargin
                />
              </Box>
            )}
          />
          {showNav ? (
            <>
              <Box
                className="z-header absolute bottom-0 left-0 top-0 justify-center pl-1"
                style={{ pointerEvents: "box-none" }}
              >
                <IconButton
                  iconName="chevron-left"
                  variant="secondary"
                  size="sm"
                  rounded="full"
                  label="Previous property"
                  disabled={activeIndex <= 0}
                  onPress={() => goTo(activeIndex - 1)}
                />
              </Box>
              <Box
                className="z-header absolute bottom-0 right-0 top-0 justify-center pr-1"
                style={{ pointerEvents: "box-none" }}
              >
                <IconButton
                  iconName="chevron-right"
                  variant="secondary"
                  size="sm"
                  rounded="full"
                  label="Next property"
                  disabled={activeIndex >= homes.length - 1}
                  onPress={() => goTo(activeIndex + 1)}
                />
              </Box>
            </>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}
