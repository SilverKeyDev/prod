import { createContext } from "react";

import type { FeedReelsContextValue } from "./FeedReelsContext.types";

export const FeedReelsContext = createContext<FeedReelsContextValue | null>(
  null,
);
