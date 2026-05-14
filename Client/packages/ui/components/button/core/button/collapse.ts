import type { ReactNode } from "react";

import { getEnv } from "packages/config/env";
import { log, LOG_CATEGORIES } from "packages/logger";

import type { HideTextBelowBreakpoint } from "./textVisibility";

export function shouldCollapseIconLabelRowOnWeb(args: {
  collapseIconWhenNarrow: boolean;
  hideTextBelow: HideTextBelowBreakpoint | undefined;
  loading: boolean;
  resolvedIcon: ReactNode;
  children: ReactNode;
}): boolean {
  if (!args.collapseIconWhenNarrow || args.loading || !args.resolvedIcon) return false;
  if (args.hideTextBelow) return false;
  return args.children != null && args.children !== false;
}

export function warnButtonCollapseA11yIfNeeded(args: {
  containerCollapse: boolean;
  children: ReactNode;
  derivedAccessibleLabel: string | undefined;
}): void {
  if (
    getEnv().isDevelopment &&
    args.containerCollapse &&
    typeof args.children !== "string" &&
    args.derivedAccessibleLabel == null
  ) {
    log.warn(
      LOG_CATEGORIES.ERRORS,
      "[Button] Icon collapse uses JSX children — provide label or aria-label for accessibility when the label hides at narrow widths."
    );
  }
}
