import { useRef } from "react";

import type { FeedScrollController } from "packages/features/feed";

import { ReelsView } from "./ReelsView";

type DesktopReelsViewProps = {
  virtuosoRef?: React.RefObject<unknown>;
};

/**
 * Native: full-screen reels feed. Uses same data and controls as web; layout adapts to viewport.
 */
export function DesktopReelsView({ virtuosoRef: _virtuosoRef }: DesktopReelsViewProps) {
  const scrollControllerRef = useRef<FeedScrollController | null>(null);
  return <ReelsView scrollControllerRef={scrollControllerRef} />;
}
