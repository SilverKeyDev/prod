import type { ReactNode } from "react";

import { ChatsProvider } from "../../../../../packages/contexts/ChatsContext";

export function ChatsOnly({ children }: { children: ReactNode }) {
  return <ChatsProvider>{children}</ChatsProvider>;
}
