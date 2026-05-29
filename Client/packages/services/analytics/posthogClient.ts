import posthog from "posthog-js";

import { getEnv } from "packages/config/env";
import { getWindow } from "packages/utils";

import { POSTHOG_APP_URL, POSTHOG_HOST } from "./posthogConstants";

let initialized = false;

export function buildPostHogWebInitOptions() {
  return {
    api_host: POSTHOG_HOST,
    ui_host: POSTHOG_APP_URL,
    person_profiles: "identified_only" as const,
    capture_pageview: true,
    capture_pageleave: true,
  };
}

export function isPostHogInitialized(): boolean {
  return initialized;
}

export function initPostHogClient(): boolean {
  if (initialized || !getWindow()) {
    return initialized;
  }

  const key = getEnv().posthogKey;
  if (!key) {
    return false;
  }

  posthog.init(key, buildPostHogWebInitOptions());
  initialized = true;
  return true;
}

export function identifyPostHogUser(
  userId: string,
  properties: Record<string, string | boolean | number | null | undefined>
): void {
  if (!initialized) {
    return;
  }
  posthog.identify(userId, properties);
}

export function resetPostHogUser(): void {
  if (!initialized) {
    return;
  }
  posthog.reset();
}

export function getPostHogDistinctId(): string | null {
  if (!initialized) {
    return null;
  }
  const distinctId = posthog.get_distinct_id();
  return distinctId?.trim() ? distinctId : null;
}

export function getPostHogSessionId(): string | null {
  if (!initialized) {
    return null;
  }
  const sessionId = posthog.get_session_id?.();
  return sessionId?.trim() ? sessionId : null;
}

export function resolvePostHogAppUrl(): string | null {
  if (!getEnv().posthogKey) {
    return null;
  }
  return POSTHOG_APP_URL;
}
