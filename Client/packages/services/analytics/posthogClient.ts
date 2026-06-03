import posthog from "posthog-js";

import { getEnv } from "packages/config/env";
import { getWindow } from "packages/utils";

import { POSTHOG_APP_URL, POSTHOG_HOST } from "./posthogConstants";

/** posthog-js sets this on the default instance after a successful init. */
type PostHogWithLoadedFlag = {
  __loaded?: boolean;
};

let initialized = false;

function isPostHogSdkLoaded(): boolean {
  return Boolean((posthog as PostHogWithLoadedFlag).__loaded);
}

function markPostHogInitialized(): void {
  initialized = true;
}

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
  return initialized || isPostHogSdkLoaded();
}

export function initPostHogClient(): boolean {
  if (!getWindow()) {
    return isPostHogInitialized();
  }

  if (initialized || isPostHogSdkLoaded()) {
    markPostHogInitialized();
    return true;
  }

  const key = getEnv().posthogKey;
  if (!key) {
    return false;
  }

  posthog.init(key, buildPostHogWebInitOptions());
  markPostHogInitialized();
  return true;
}

export function identifyPostHogUser(
  userId: string,
  properties: Record<string, string | boolean | number | null | undefined>
): void {
  if (!isPostHogInitialized()) {
    return;
  }
  markPostHogInitialized();
  posthog.identify(userId, properties);
}

export function resetPostHogUser(): void {
  if (!isPostHogInitialized()) {
    return;
  }
  markPostHogInitialized();
  posthog.reset();
}

export function getPostHogDistinctId(): string | null {
  if (!isPostHogInitialized()) {
    return null;
  }
  markPostHogInitialized();
  const distinctId = posthog.get_distinct_id();
  return distinctId?.trim() ? distinctId : null;
}

export function getPostHogSessionId(): string | null {
  if (!isPostHogInitialized()) {
    return null;
  }
  markPostHogInitialized();
  const sessionId = posthog.get_session_id?.();
  return sessionId?.trim() ? sessionId : null;
}

export function resolvePostHogAppUrl(): string | null {
  if (!getEnv().posthogKey) {
    return null;
  }
  return POSTHOG_APP_URL;
}
