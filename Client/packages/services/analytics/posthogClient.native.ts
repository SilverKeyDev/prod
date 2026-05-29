import PostHog from "posthog-react-native";

import { getEnv } from "packages/config/env";

import { POSTHOG_API_HOST, POSTHOG_APP_URL } from "./posthogConstants";

let posthogClient: PostHog | null = null;
let initialized = false;

function readPosthogKey(): string | null {
  const key = getEnv().posthogKey;
  return key || null;
}

export function isPostHogInitialized(): boolean {
  return initialized && posthogClient !== null;
}

export function initPostHogClient(): boolean {
  if (initialized) {
    return posthogClient !== null;
  }

  const key = readPosthogKey();
  if (!key) {
    initialized = true;
    return false;
  }

  posthogClient = new PostHog(key, {
    host: POSTHOG_API_HOST,
    logs: {
      serviceName: "silverkey-mobile",
    },
  });
  initialized = true;
  return true;
}

export function identifyPostHogUser(
  userId: string,
  properties: Record<string, string | boolean | number | null | undefined>
): void {
  if (!posthogClient) {
    return;
  }
  posthogClient.identify(userId, properties);
}

export function resetPostHogUser(): void {
  if (!posthogClient) {
    return;
  }
  posthogClient.reset();
}

export function getPostHogDistinctId(): string | null {
  if (!posthogClient) {
    return null;
  }
  const distinctId = posthogClient.getDistinctId();
  return distinctId?.trim() ? distinctId : null;
}

export function getPostHogSessionId(): string | null {
  if (!posthogClient) {
    return null;
  }
  const sessionId = posthogClient.getSessionId();
  return sessionId?.trim() ? sessionId : null;
}

export function getPostHogNativeClient(): PostHog | null {
  return posthogClient;
}

export function resolvePostHogAppUrl(): string | null {
  if (!readPosthogKey()) {
    return null;
  }
  return POSTHOG_APP_URL;
}
