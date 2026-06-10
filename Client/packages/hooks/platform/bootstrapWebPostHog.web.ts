import { initPostHogClient } from "packages/services/analytics";

/** Web entry bootstrap: initialize PostHog before React mounts. */
export function bootstrapWebPostHog(): void {
  initPostHogClient();
}
