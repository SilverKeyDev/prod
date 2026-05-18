import { FeedReelsContext } from "packages/features/feed/hooks/feedReels/FeedReelsContext.context";
import type { FeedReelsProviderProps } from "packages/features/feed/hooks/feedReels/FeedReelsContext.types";

export function FeedReelsProvider({ value, children }: FeedReelsProviderProps) {
  return <FeedReelsContext.Provider value={value}>{children}</FeedReelsContext.Provider>;
}
