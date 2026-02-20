/**
 * Helpers for useOnboardingForm to keep the main hook under max-lines-per-function.
 */

import { log, LOG_CATEGORIES } from "packages/logger";
import { getWindow } from "packages/utils";
import type { OnboardingData } from "packages/utils/domain/profile";

export function getOnboardingDraftFromStorage(): OnboardingData | null {
  const win = getWindow();
  const loc = win
    ? (win as unknown as Record<string, Storage | undefined>)["localStorage"]
    : undefined;
  const draft = loc?.getItem("onboardingDraft");
  if (!draft) return null;
  try {
    const parsed = JSON.parse(draft) as Record<string, unknown>;
    if (parsed && typeof parsed === "object") {
      return parsed as OnboardingData;
    }
  } catch {
    log.warn(LOG_CATEGORIES.ERRORS, "Invalid onboarding draft data");
  }
  return null;
}

export function persistOnboardingDraft(formData: OnboardingData): void {
  const win = getWindow();
  const loc = win
    ? (win as unknown as Record<string, Storage | undefined>)["localStorage"]
    : undefined;
  if (loc) {
    loc.setItem("onboardingDraft", JSON.stringify(formData));
  }
}

export function getScriptsReady(
  googleMapsLoaded: boolean,
  googleMapsError: unknown,
): boolean {
  if (googleMapsError) return false;
  const win = getWindow();
  return !!(
    googleMapsLoaded &&
    win &&
    (win as unknown as { google?: { maps?: { places?: unknown } } }).google
      ?.maps?.places
  );
}
