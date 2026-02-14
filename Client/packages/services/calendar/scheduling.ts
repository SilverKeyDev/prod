/**
 * Scheduling service for Google Calendar scheduling MVP
 */

import { googleCalendarApi, type GoogleEvent } from "../../config/api";
import type {
  FreebusyRequest,
  FreebusyResponse,
  FreebusyTimeBlock,
  ScheduleEventRequest,
  TimeSlot,
  WorkingHours,
} from "../../schemas/calendar/scheduling";
import {
  generateTimeSlots,
  getBusyBlocksFromResponse,
} from "../../utils/calendar/scheduling";

/**
 * Query availability using freebusy API
 */
export async function queryAvailability(
  timeMin: string,
  timeMax: string,
  calendarIds?: string[],
): Promise<FreebusyTimeBlock[]> {
  const request: FreebusyRequest = {
    timeMin,
    timeMax,
    calendarIds: calendarIds || ["primary"],
  };

  const response = await googleCalendarApi.queryFreebusy(request);

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to query availability");
  }

  return getBusyBlocksFromResponse(response.data.calendars);
}

/**
 * Generate time slots from availability data
 */
export function generateAvailableTimeSlots(
  busyBlocks: FreebusyTimeBlock[],
  startDate: Date,
  endDate: Date,
  slotDurationMinutes: number = 30,
  workingHours?: WorkingHours,
): TimeSlot[] {
  return generateTimeSlots(
    busyBlocks,
    startDate,
    endDate,
    slotDurationMinutes,
    workingHours,
  );
}

/**
 * Create a scheduled event on SilverKey calendar
 */
export async function createScheduledEvent(
  eventData: ScheduleEventRequest,
  silverKeyCalendarId: string,
): Promise<unknown> {
  // Convert our scheduling request shape to the Google Calendar event shape
  const event: GoogleEvent = {
    calendarId: silverKeyCalendarId,
    summary: eventData.summary,
    description: eventData.description,
    start: { dateTime: eventData.start },
    end: { dateTime: eventData.end },
    attendees: eventData.attendees,
    location: eventData.location,
  };

  const response = await googleCalendarApi.createEvent(event);

  if (!response.success || !response.data) {
    throw new Error(response.error || "Failed to create scheduled event");
  }

  return response.data;
}

/**
 * Get or create SilverKey calendar
 */
export async function getOrCreateSilverKeyCalendar(
  buyerName?: string,
): Promise<string> {
  const response =
    await googleCalendarApi.getOrCreateSilverKeyCalendar(buyerName);

  if (!response.success || !response.data) {
    throw new Error(
      response.error || "Failed to get or create SilverKey calendar",
    );
  }

  return response.data.id;
}
