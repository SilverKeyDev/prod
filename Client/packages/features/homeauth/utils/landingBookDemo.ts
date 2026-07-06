import { trackLandingCta } from "packages/hooks/analytics/trackLandingAnalytics";
import { getWindow } from "packages/utils/core/platform";

/** Jayce's 30-minute demo booking page (Google Calendar). */
export const LANDING_BOOK_DEMO_URL = "https://calendar.app.google/KttMBPG1TdcBd33L9" as const;

export function openLandingBookDemo(location: string): void {
  trackLandingCta(location);
  getWindow()?.open(LANDING_BOOK_DEMO_URL, "_blank", "noopener,noreferrer");
}
