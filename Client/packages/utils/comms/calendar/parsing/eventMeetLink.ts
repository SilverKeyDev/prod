import type { components } from "packages/types/api.generated";
import { isGoogleMeetProvisioningPending } from "packages/utils/comms/calendar/createEvent/googleMeetAfterCreate";

type GoogleEvent = components["schemas"]["GoogleEvent"];

function hasNonEmptyHangoutLink(event: GoogleEvent): boolean {
  return typeof event.hangoutLink === "string" && event.hangoutLink.length > 0;
}

/** True when virtual meeting was requested for this event (DB overlay preferred). */
export function isVirtualMeetingEnabled(event: GoogleEvent): boolean {
  if (event.silverKeyVirtualMeetingEnabled === true) {
    return true;
  }
  if (event.silverKeyVirtualMeetingEnabled === false) {
    return false;
  }
  return hasNonEmptyHangoutLink(event) || isGoogleMeetProvisioningPending(event);
}

/** Resolved Meet URL for display, or null when not yet available. */
export function resolveEventMeetLink(event: GoogleEvent): string | null {
  if (!isVirtualMeetingEnabled(event)) {
    return null;
  }
  return hasNonEmptyHangoutLink(event) ? event.hangoutLink! : null;
}

/** True when virtual meeting is on but Google has not returned a link yet. */
export function isEventMeetLinkPending(event: GoogleEvent): boolean {
  return (
    isVirtualMeetingEnabled(event) &&
    !resolveEventMeetLink(event) &&
    isGoogleMeetProvisioningPending(event)
  );
}
