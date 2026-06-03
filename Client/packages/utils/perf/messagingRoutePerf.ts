import { log } from "packages/logger";

const MESSAGING_NAV_MARK = "silverkey-shell-messaging-nav-start";

function getLatestMessagingNavMarkStartMs(): number | null {
  const marks = performance.getEntriesByName(MESSAGING_NAV_MARK, "mark");
  if (marks.length === 0) return null;
  const last = marks[marks.length - 1];
  return last.startTime;
}

/**
 * Debug timing vs the most recent `silverkey-shell-messaging-nav-start` mark (see shellRouteNavigateStart).
 * No-op when that mark is missing (e.g. not on /messaging shell timing path).
 */
export function logMessagingCheckpointSinceLatestShellMark(label: string): void {
  const markStart = getLatestMessagingNavMarkStartMs();
  if (markStart === null) {
    log.debug("MESSAGES", "[PERF] Messaging route checkpoint (no shell nav mark)", {
      label,
    });
    return;
  }
  const sinceNavMs = Math.round((performance.now() - markStart) * 100) / 100;
  log.debug("MESSAGES", "[PERF] Messaging route checkpoint", { label, sinceNavMs });
}
