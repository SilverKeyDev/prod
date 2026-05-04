import type { components } from "packages/types/api.generated";

type BaseGoogleEvent = components["schemas"]["GoogleEvent"];

/**
 * Extended Google Calendar event used when merging client events with Google Calendar data.
 * Lives under packages/types so profile/calendar/hooks can share it without feature→feature imports.
 */
export type ProfileAvailabilityEventMeta =
  | { kind: "weekly"; ruleId: string; date: string }
  | { kind: "oneOff"; oneOffId: string };

export interface ExtendedGoogleEvent extends BaseGoogleEvent {
  isClientEvent?: boolean;
  /** Injected when listing events from a calendar (see useGoogleEventsHelpers). */
  calendarId?: string;
  /** True for in-grid optimistic draft before API create completes. */
  isOptimisticCalendarDraft?: boolean;
  /** Synthetic profile availability block (not from Google Calendar). */
  isProfileAvailabilityEvent?: boolean;
  availabilityMeta?: ProfileAvailabilityEventMeta;
}
