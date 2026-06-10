import { getEvent } from "packages/features/calendar/api/events";
import {
  copyTextToClipboard,
  isGoogleMeetProvisioningPending,
  pollGoogleMeetHangoutLink as pollGoogleMeetHangoutLinkBase,
} from "packages/utils/comms/calendar/createEvent/googleMeetAfterCreate";

export { copyTextToClipboard, isGoogleMeetProvisioningPending };

export function pollGoogleMeetHangoutLink(
  eventId: string,
  calendarId: string
): Promise<string | null> {
  return pollGoogleMeetHangoutLinkBase(eventId, calendarId, getEvent);
}
