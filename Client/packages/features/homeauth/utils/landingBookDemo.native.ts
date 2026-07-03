import { Linking } from "react-native";

import { trackLandingCta } from "packages/hooks/analytics/trackLandingAnalytics";

/** Jayce's 30-minute demo booking page (Google Calendar). */
export const LANDING_BOOK_DEMO_URL = "https://calendar.app.google/KttMBPG1TdcBd33L9" as const;

export function openLandingBookDemo(location: string): void {
  trackLandingCta(location);
  void Linking.openURL(LANDING_BOOK_DEMO_URL);
}
