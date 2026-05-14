import { getEnv } from "packages/config/env";
import { log, LOG_CATEGORIES } from "packages/logger";

/** Dev-only guidance for `asChild` and related props (keeps `Button` callback complexity down). */
export function warnButtonAsChildDev(args: {
  asChild: boolean;
  isNative: boolean;
  icon: unknown;
  iconName: unknown;
  loading: boolean;
}): void {
  if (!getEnv().isDevelopment) return;
  if (args.asChild && args.isNative) {
    log.warn(LOG_CATEGORIES.HOOKS, "[Button] asChild is web-only; ignored on React Native.");
  }
  if (args.asChild && (args.icon != null || args.iconName != null)) {
    log.warn(
      LOG_CATEGORIES.HOOKS,
      "[Button] asChild is set — icon/iconName are ignored; compose icons inside the child element."
    );
  }
  if (args.asChild && args.loading) {
    log.warn(
      LOG_CATEGORIES.HOOKS,
      "[Button] asChild with loading uses className + aria-busy only; no loading overlay is rendered."
    );
  }
}
