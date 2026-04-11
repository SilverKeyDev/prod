import { useRef } from "react";

import type { FeedScrollController } from "packages/features/feed";
import type { SearchResult } from "packages/features/search/types";

import { ReelsView } from "./ReelsView";

export type DesktopReelsViewProps = {
  virtuosoRef?: React.RefObject<unknown>;
  filteredSearchResults: SearchResult[];
  onRunSearch: () => void | Promise<void>;
  isSearching?: boolean;
};

/**
 * Native: full-screen reels feed. Uses same data and controls as web; layout adapts to viewport.
 */
export function DesktopReelsView({
  virtuosoRef: _virtuosoRef,
  filteredSearchResults,
  onRunSearch,
  isSearching,
}: DesktopReelsViewProps) {
  const scrollControllerRef = useRef<FeedScrollController | null>(null);
  return (
    <ReelsView
      filteredSearchResults={filteredSearchResults}
      onRunSearch={onRunSearch}
      isSearching={isSearching}
      scrollControllerRef={scrollControllerRef}
    />
  );
}
