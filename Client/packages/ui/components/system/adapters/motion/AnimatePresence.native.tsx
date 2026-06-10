import { Fragment } from "react";

import type { ReactNode } from "react";

/** Native: render children only; exit animations not supported. */
export function AnimatePresence({
  children,
  mode: _mode,
  initial: _initial,
}: {
  children?: ReactNode;
  mode?: "wait" | "sync" | "popLayout";
  initial?: boolean;
}): React.ReactElement {
  return <Fragment>{children}</Fragment>;
}
