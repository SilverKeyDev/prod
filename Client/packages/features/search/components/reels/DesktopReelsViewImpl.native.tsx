import { useRef } from "react";

import type { FeedScrollController } from "packages/features/feed";

import { ReelsView } from "./ReelsView";

type DesktopReelsViewProps = {
  virtuosoRef?: React.RefObject<unknown>;
};

/**
 * Native: full-screen reels feed. Same data as web; no theater layout or shortcuts.
 */
export function DesktopReelsView({ virtuosoRef: _virtuosoRef }: DesktopReelsViewProps) {
  const scrollControllerRef = useRef<FeedScrollController | null>(null);
  return <ReelsView scrollControllerRef={scrollControllerRef} />;
}
