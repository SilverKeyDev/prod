import type { components } from "packages/types/api.generated";
import { getNavigator } from "packages/utils/core/platform";

type GoogleEvent = components["schemas"]["GoogleEvent"];

type ConferenceDataLike = {
  createRequest?: {
    status?: { statusCode?: string | null } | null;
  } | null;
} | null;

export type FetchGoogleEventResult = {
  success: boolean;
  data?: { hangoutLink?: string | null } | null;
};

export type FetchGoogleEventFn = (
  eventId: string,
  calendarId: string
) => Promise<FetchGoogleEventResult>;

export function isGoogleMeetProvisioningPending(event: GoogleEvent): boolean {
  const cd = event.conferenceData as ConferenceDataLike;
  return cd?.createRequest?.status?.statusCode === "pending";
}

const POLL_INTERVAL_MS = 900;
const POLL_MAX_MS = 10_000;

export async function pollGoogleMeetHangoutLink(
  eventId: string,
  calendarId: string,
  fetchEvent: FetchGoogleEventFn
): Promise<string | null> {
  const deadline = Date.now() + POLL_MAX_MS;
  while (Date.now() < deadline) {
    const res = await fetchEvent(eventId, calendarId);
    if (!res.success || !res.data) {
      break;
    }
    const link = res.data.hangoutLink;
    if (typeof link === "string" && link.length > 0) {
      return link;
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return null;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    const nav = getNavigator();
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
