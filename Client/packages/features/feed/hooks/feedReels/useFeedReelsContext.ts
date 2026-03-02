import { useContext } from "react";

import { FeedReelsContext } from "./FeedReelsContext.context";
import type { FeedReelsContextValue } from "./FeedReelsContext.types";

export function useFeedReelsContext(): FeedReelsContextValue {
  const ctx = useContext(FeedReelsContext);
  if (!ctx) throw new Error("FeedReelsProvider required");
  return ctx;
}
