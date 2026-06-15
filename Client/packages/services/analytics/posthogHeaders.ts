import { getPostHogDistinctId, getPostHogSessionId, isPostHogInitialized } from "./posthogClient";

export const POSTHOG_DISTINCT_ID_HEADER = "X-POSTHOG-DISTINCT-ID";
export const POSTHOG_SESSION_ID_HEADER = "X-POSTHOG-SESSION-ID";

export function getPostHogRequestHeaders(): Record<string, string> {
  if (!isPostHogInitialized()) {
    return {};
  }

  const headers: Record<string, string> = {};
  const distinctId = getPostHogDistinctId();
  const sessionId = getPostHogSessionId();

  if (distinctId) {
    headers[POSTHOG_DISTINCT_ID_HEADER] = distinctId;
  }
  if (sessionId) {
    headers[POSTHOG_SESSION_ID_HEADER] = sessionId;
  }

  return headers;
}
