import type { FeedListing, FeedScrollController } from "@/features/feed/types/feed";

export type FeedScrollContainerProps = {
  items: FeedListing[];
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  /** Web: VirtuosoHandle; native: FlatList ref. */
  virtuosoRef?: React.RefObject<unknown>;
  scrollControllerRef?: React.MutableRefObject<FeedScrollController | null>;
};
