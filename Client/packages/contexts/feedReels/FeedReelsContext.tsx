import { FeedReelsContext as Ctx } from "./FeedReelsContext.context";
import type { FeedReelsProviderProps } from "./FeedReelsContext.types";

export function FeedReelsProvider({ value, children }: FeedReelsProviderProps) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
