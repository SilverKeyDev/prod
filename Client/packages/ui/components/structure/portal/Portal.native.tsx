import { Fragment } from "react";

import type { ReactNode } from "react";

export type PortalProps = { children: ReactNode };

/**
 * Native: render children in place (no DOM portal). Use RN Modal for overlay UIs.
 */
export function Portal({ children }: PortalProps): React.ReactElement {
  return <Fragment>{children}</Fragment>;
}
