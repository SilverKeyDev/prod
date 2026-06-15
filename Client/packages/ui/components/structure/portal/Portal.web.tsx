import { createPortal } from "react-dom";

import type { ReactNode } from "react";

import { getDocument } from "packages/utils/core/platform";

export type PortalProps = { children: ReactNode };

/**
 * Web: render children into document.body via createPortal.
 * Uses getDocument() so shared package stays RN-safe.
 */
export function Portal({ children }: PortalProps): React.ReactPortal | null {
  const doc = getDocument();
  if (!doc?.body) return null;
  return createPortal(children, doc.body);
}
