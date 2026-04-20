import { getWindow } from "packages/utils/platform";

import { buildAgentProfileUrl } from "./slug";

/** Production web origin for share links when `window` is unavailable (e.g. React Native). */
const DEFAULT_SHAREABLE_WEB_ORIGIN = "https://usesilverkey.com";

/**
 * Absolute HTTPS URL for the public agent profile page (web: current origin; native: default prod host).
 */
export function getAgentPublicProfileAbsoluteUrl(agentId: string, displayName: string): string {
  const path = buildAgentProfileUrl(agentId, displayName);
  const origin = getWindow()?.location?.origin;
  if (origin) {
    return `${origin}${path}`;
  }
  return `${DEFAULT_SHAREABLE_WEB_ORIGIN}${path}`;
}
