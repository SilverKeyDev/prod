/**
 * Helpers for useOnboardingForm to keep the main hook under max-lines-per-function.
 * Uses platform getLocalStorage so draft works on web and React Native.
 */

import { log, LOG_CATEGORIES } from "packages/logger";
import { getWindow } from "packages/utils/platform";
import { getLocalStorage } from "packages/utils/storage/platformStorage";

import type { OnboardingData } from "@/features/profile/utils";

const ONBOARDING_DRAFT_KEY = "onboardingDraft";

export function getOnboardingDraftFromStorage(): OnboardingData | null {
  const loc = getLocalStorage();
  const draft = loc.getItem(ONBOARDING_DRAFT_KEY);
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
  getLocalStorage().setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(formData));
}

export function getScriptsReady(googleMapsLoaded: boolean, googleMapsError: unknown): boolean {
  if (googleMapsError) return false;
  const win = getWindow();
  return !!(
    googleMapsLoaded &&
    win &&
    (win as unknown as { google?: { maps?: { places?: unknown } } }).google?.maps?.places
  );
}
