import posthog from "posthog-js";

import { initPostHogClient, isPostHogInitialized } from "packages/services/analytics/posthogClient";

function captureLandingEvent(event: string, properties?: Record<string, string | number>): void {
  initPostHogClient();
  if (!isPostHogInitialized()) {
    return;
  }
  posthog.capture(event, properties);
}

export function trackLandingCta(location: string): void {
  captureLandingEvent("cta_clicked", { location });
}

export function trackLandingSlider(slider: string, value: number): void {
  captureLandingEvent("roi_slider_used", { slider, value });
}
