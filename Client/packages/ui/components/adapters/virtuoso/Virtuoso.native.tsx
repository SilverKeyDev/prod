import React, { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

import {
  FlatList,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

/**
 * Native: FlatList-based virtual list. Same props shape as web Virtuoso for API parity.
 */
export type VirtuosoHandle = {
  scrollToIndex: (opts: { index: number }) => void;
};

type VirtuosoProps = {
  data?: unknown[];
  style?: StyleProp<ViewStyle>;
  components?: {
    List?: React.ComponentType<unknown>;
    Item?: React.ComponentType<unknown>;
    Scroller?: React.ComponentType<unknown>;
    Footer?: React.ComponentType<unknown>;
  };
  initialTopMostItemIndex?: number;
  fixedItemHeight?: number;
  increaseViewportBy?: { top?: number; bottom?: number };
  itemContent?: (index: number, item: unknown) => React.ReactNode;
  rangeChanged?: (range: { startIndex: number; endIndex: number }) => void;
  atBottomStateChange?: (atBottom: boolean) => void;
  followOutput?: string;
  ref?: React.Ref<VirtuosoHandle>;
};

const VirtuosoComponent = forwardRef<VirtuosoHandle, VirtuosoProps>(function Virtuoso(
  {
    data = [],
    style,
    itemContent,
    initialTopMostItemIndex,
    fixedItemHeight = 0,
    increaseViewportBy,
    atBottomStateChange,
    components,
  },
  ref
) {
  const flatListRef = useRef<FlatList>(null);
  const atBottomRef = useRef<boolean | null>(null);
  const itemHeight = fixedItemHeight > 0 ? fixedItemHeight : undefined;

  useImperativeHandle(ref, () => ({
    scrollToIndex: ({ index }: { index: number }) => {
      flatListRef.current?.scrollToIndex({ index, animated: true });
    },
  }));

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<unknown>) =>
      itemContent ? itemContent(index, item) : null,
    [itemContent]
  );

  const keyExtractor = useCallback((item: unknown, index: number) => {
    if (
      item != null &&
      typeof item === "object" &&
      "id" in item &&
      typeof (item as { id: unknown }).id === "string"
    ) {
      return (item as { id: string }).id;
    }
    return String(index);
  }, []);

  const getItemLayoutWhenFixed = useCallback(
    (_: unknown, index: number) => ({
      length: itemHeight ?? 0,
      offset: (itemHeight ?? 0) * index,
      index,
    }),
    [itemHeight]
  );
  const getItemLayout = itemHeight !== undefined ? getItemLayoutWhenFixed : undefined;

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!atBottomStateChange) return;
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const padding = (increaseViewportBy?.bottom ?? 0) + (increaseViewportBy?.top ?? 0);
      const atBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - padding;
      if (atBottomRef.current !== atBottom) {
        atBottomRef.current = atBottom;
        atBottomStateChange(atBottom);
      }
    },
    [atBottomStateChange, increaseViewportBy]
  );

  const handleEndReached = useCallback(() => {
    if (atBottomRef.current !== true) {
      atBottomRef.current = true;
      atBottomStateChange?.(true);
    }
  }, [atBottomStateChange]);

  const ListFooterComponent = components?.Footer
    ? React.createElement(components.Footer)
    : undefined;

  return (
    <FlatList
      ref={flatListRef}
      data={data as unknown[]}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={style}
      initialScrollIndex={initialTopMostItemIndex}
      getItemLayout={getItemLayout}
      onScroll={handleScroll}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      scrollEventThrottle={16}
      ListFooterComponent={ListFooterComponent}
    />
  );
});

export { VirtuosoComponent as Virtuoso };
export type { VirtuosoHandle };
