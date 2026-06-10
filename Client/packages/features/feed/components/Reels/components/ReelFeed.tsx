import { forwardRef, useCallback, useEffect, useRef, useState } from "react";

import { spacing } from "packages/design-tokens";
import { Box } from "packages/ui/components/structure/primitives";
import { Virtuoso, type VirtuosoHandle } from "packages/ui/components/system/adapters/virtuoso";
import { getWindow } from "packages/utils/core/platform";

import type { PostData } from "@/features/feed/types/feed";

import { ReelItem } from "./ReelItem";

/** Custom Scroller with scroll-snap for vertical Reels feed. */
const ReelsScroller = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => (
    <Box
      ref={ref}
      {...props}
      className={`scrollbar-hide ${props.className ?? ""}`.trim()}
      style={{
        ...props.style,
        overflow: "auto",
        overflowX: "hidden",
        scrollSnapType: "y mandatory",
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
    />
  )
);
ReelsScroller.displayName = "ReelsScroller";

/** List wrapper: no gap between reels (scroll-snap). */
const ReelsList = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  (props, ref) => (
    <Box
      ref={ref}
      {...props}
      style={{
        ...props.style,
        display: "flex",
        flexDirection: "column",
        gap: spacing(0),
        margin: spacing(0),
        padding: spacing(0),
      }}
      className={props.className}
    />
  )
);
ReelsList.displayName = "ReelsList";

/** Item wrapper: no margin/padding so reels sit flush. */
const ReelsItem = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  (props, ref) => (
    <Box
      ref={ref}
      {...props}
      style={{ ...props.style, margin: spacing(0), padding: spacing(0) }}
      className={props.className}
    />
  )
);
ReelsItem.displayName = "ReelsItem";

export type ReelFeedProps = {
  posts: PostData[];
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
};

const ReelFeedFooter = () => (
  <Box className="h-0 shrink-0 max-md:min-h-[var(--mobile-bottom-reserved)]" aria-hidden />
);

/**
 * Vertical Reels-style feed. Tracks activePostId (post in viewport) and
 * renders each post as a ReelItem (horizontal Embla carousel: video + images).
 */
export function ReelFeed({
  posts,
  fetchNextPage,
  hasNextPage = false,
  isFetchingNextPage = false,
}: ReelFeedProps) {
  const [activePostId, setActivePostId] = useState<string | null>(posts[0]?.id ?? null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [viewportHeight, setViewportHeight] = useState(() => {
    const win = getWindow();
    return win ? win.innerHeight : 0;
  });
  useEffect(() => {
    const win = getWindow();
    if (!win) return;
    const update = () => setViewportHeight(win.innerHeight);
    win.addEventListener("resize", update);
    return () => win.removeEventListener("resize", update);
  }, []);

  const handleRangeChanged = useCallback(
    (range: { startIndex: number; endIndex: number }) => {
      const post = posts[range.startIndex];
      setActivePostId(post?.id ?? null);
    },
    [posts]
  );

  const handleAtBottom = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <Box
      className="h-[100dvh] w-full overflow-hidden bg-black"
      data-reel-feed-container
      style={
        {
          "--reel-viewport-height": `${viewportHeight}px`,
        } as React.CSSProperties
      }
    >
      <Virtuoso
        ref={virtuosoRef}
        data={posts}
        style={{ height: "100%", width: "100%" }}
        components={{
          List: ReelsList,
          Item: ReelsItem,
          Scroller: ReelsScroller,
          Footer: ReelFeedFooter,
        }}
        fixedItemHeight={viewportHeight}
        increaseViewportBy={{ top: 200, bottom: 200 }}
        itemContent={(index, post) => (
          <ReelItem
            key={post.id}
            post={post}
            isActive={activePostId === post.id}
            index={index}
            activeIndex={activePostId !== null ? posts.findIndex((p) => p.id === activePostId) : -1}
          />
        )}
        rangeChanged={handleRangeChanged}
        atBottomStateChange={(atBottom) => {
          if (atBottom) handleAtBottom();
        }}
        followOutput="smooth"
      />
    </Box>
  );
}
