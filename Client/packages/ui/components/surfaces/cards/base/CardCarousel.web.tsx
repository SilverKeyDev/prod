import React from "react";

import { Box } from "packages/ui/components/structure/primitives";

export type CardCarouselProps<T> = {
  items: T[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey: (item: T, index: number) => string;
  cardMinWidth?: number;
  cardGap?: number;
  infiniteLoop?: boolean;
  centerMode?: boolean;
  selectedItem?: number;
  onSlideChange?: (index: number) => void;
  ariaLabel?: string;
};

function CardCarousel<T>({
  items,
  loading = false,
  error = null,
  emptyMessage,
  renderItem,
  getItemKey,
  cardMinWidth = 240,
  cardGap = 12,
  ariaLabel = "Carousel",
}: CardCarouselProps<T>): React.JSX.Element {
  if (loading) {
    return (
      <Box className="scrollbar-hide flex gap-4 overflow-x-auto p-2" aria-label={ariaLabel}>
        <Box className="h-48 min-w-52 animate-pulse rounded-lg bg-gray-200" />
        <Box className="h-48 min-w-52 animate-pulse rounded-lg bg-gray-200" />
        <Box className="h-48 min-w-52 animate-pulse rounded-lg bg-gray-200" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="p-4 text-sm text-red-600" role="alert">
        {error}
      </Box>
    );
  }

  if (items.length === 0 && emptyMessage) {
    return (
      <Box className="p-4 text-sm text-gray-500" aria-label={ariaLabel}>
        {emptyMessage}
      </Box>
    );
  }

  return (
    <Box
      className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden scroll-smooth py-2"
      style={{ gap: cardGap }}
      aria-label={ariaLabel}
      role="list"
    >
      {items.map((item, index) => (
        <Box
          key={getItemKey(item, index)}
          className="flex-shrink-0 snap-start"
          style={{ minWidth: cardMinWidth }}
          role="listitem"
        >
          {renderItem(item, index)}
        </Box>
      ))}
    </Box>
  );
}

export default CardCarousel;
