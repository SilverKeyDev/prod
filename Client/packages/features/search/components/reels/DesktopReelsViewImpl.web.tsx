import { useRef } from "react";

import type { VirtuosoHandle } from "react-virtuoso";

import { DEFAULT_PLACEHOLDER_IMAGE, type FeedScrollController } from "packages/features/feed";
import type { SearchResult } from "packages/features/search/types";
import { useIsMobile } from "packages/hooks/ui";
import { useReelsShortcuts } from "packages/hooks/ui";
import { Box } from "packages/ui/components/structure/primitives";

import { ReelsView } from "./ReelsView";

export type DesktopReelsViewProps = {
  virtuosoRef?: React.RefObject<VirtuosoHandle | null>;
  filteredSearchResults: SearchResult[];
  onRunSearch: () => void | Promise<void>;
  isSearching?: boolean;
};

/**
 * Desktop Reels view with keyboard/wheel shortcuts and theater layout.
 * - 100vw × 100vh container
 * - Centered 9:16 video area
 * - Side wings: blurred background, metadata panel
 */
export function DesktopReelsView({
  virtuosoRef,
  filteredSearchResults,
  onRunSearch,
  isSearching,
}: DesktopReelsViewProps) {
  const isMobile = useIsMobile();
  const scrollControllerRef = useRef<FeedScrollController | null>(null);

  useReelsShortcuts({
    scrollControllerRef,
    enabled: !isMobile,
  });

  if (isMobile) {
    return (
      <ReelsView
        filteredSearchResults={filteredSearchResults}
        onRunSearch={onRunSearch}
        isSearching={isSearching}
        virtuosoRef={virtuosoRef}
        scrollControllerRef={scrollControllerRef}
        className="h-full"
      />
    );
  }

  return (
    <Box className="relative z-0 flex h-full w-full items-center justify-center bg-black">
      <Box
        className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl"
        style={{
          backgroundImage: `url(${DEFAULT_PLACEHOLDER_IMAGE})`,
        }}
        aria-hidden
      />
      <Box className="z-header relative flex h-full w-full max-w-[80vw] shrink-0 items-center justify-center">
        <ReelsView
          filteredSearchResults={filteredSearchResults}
          onRunSearch={onRunSearch}
          isSearching={isSearching}
          virtuosoRef={virtuosoRef}
          scrollControllerRef={scrollControllerRef}
        />
      </Box>
    </Box>
  );
}
