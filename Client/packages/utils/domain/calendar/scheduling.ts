/**
 * Scheduling utilities for Google Calendar scheduling MVP
 */

import type {
  FreebusyTimeBlock,
  TimeSlot,
  WorkingHours,
} from "packages/schemas/calendar/scheduling";
import { dateNow, dateParseISO, dayjs } from "packages/utils/core/date";

/**
 * Default working hours (9 AM - 6 PM)
 */
export function getDefaultWorkingHours(): WorkingHours {
  return {
    start: 9, // 9 AM
    end: 18, // 6 PM
  };
}

/**
 * Check if a time slot conflicts with any busy blocks
 */
export function isTimeSlotAvailable(
  slot: TimeSlot,
  busyBlocks: FreebusyTimeBlock[],
): boolean {
  const slotStart = slot.start.getTime();
  const slotEnd = slot.end.getTime();

  for (const busy of busyBlocks) {
    const busyStart = dateParseISO(busy.start).valueOf();
    const busyEnd = dateParseISO(busy.end).valueOf();

    // Check if slot overlaps with busy block
    if (slotStart < busyEnd && slotEnd > busyStart) {
      return false;
    }
  }

  return true;
}

/**
 * Generate time slots from busy blocks
 */
export function generateTimeSlots(
  busyBlocks: FreebusyTimeBlock[],
  startDate: Date,
  endDate: Date,
  slotDurationMinutes: number = 30,
  workingHours?: WorkingHours,
): TimeSlot[] {
  const hours = workingHours || getDefaultWorkingHours();
  const slots: TimeSlot[] = [];

  let currentDate = dayjs(startDate).startOf("day");
  const finalDate = dayjs(endDate).endOf("day");

  while (currentDate.isSameOrBefore(finalDate)) {
    const dayStart = currentDate
      .hour(hours.start)
      .minute(0)
      .second(0)
      .millisecond(0);
    const dayEnd = currentDate
      .hour(hours.end)
      .minute(0)
      .second(0)
      .millisecond(0);

    let slotStart = dayStart;
    while (slotStart.isBefore(dayEnd)) {
      const slotEndTime = slotStart.add(slotDurationMinutes, "minute");

      if (slotEndTime.isAfter(dayEnd)) {
        break;
      }

      const slot: TimeSlot = {
        start: slotStart.toDate(),
        end: slotEndTime.toDate(),
        isAvailable: true,
      };

      slot.isAvailable = isTimeSlotAvailable(slot, busyBlocks);
      slots.push(slot);
      slotStart = slotEndTime;
    }

    currentDate = currentDate.add(1, "day");
  }

  return slots;
}

/**
 * Format a time slot for display
 */
export function formatTimeSlot(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format a date for display (e.g., "Today", "Tomorrow", or date)
 */
export function formatDateLabel(date: Date): string {
  const today = dateNow().startOf("day");
  const tomorrow = dateNow().startOf("day").add(1, "day");
  const dateToCheck = dayjs(date).startOf("day");

  if (dateToCheck.isSame(today, "day")) {
    return "Today";
  }
  if (dateToCheck.isSame(tomorrow, "day")) {
    return "Tomorrow";
  }
  return dateToLocaleDateString(date);
}

/**
 * Format a date to a locale date string
 */
export function dateToLocaleDateString(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a full time slot range for display
 */
export function formatTimeSlotRange(slot: TimeSlot): string {
  const dateLabel = formatDateLabel(slot.start);
  const startTime = formatTimeSlot(slot.start);
  const endTime = formatTimeSlot(slot.end);
  return `${dateLabel}, ${startTime} - ${endTime}`;
}

/**
 * Get busy blocks from freebusy response
 */
export function getBusyBlocksFromResponse(
  freebusyResponse: Record<string, { busy: FreebusyTimeBlock[] }>,
): FreebusyTimeBlock[] {
  const allBusyBlocks: FreebusyTimeBlock[] = [];

  for (const calendarId in freebusyResponse) {
    const calendar = freebusyResponse[calendarId];
    if (calendar.busy) {
      allBusyBlocks.push(...calendar.busy);
    }
  }

  // Sort by start time
  return allBusyBlocks.sort(
    (a, b) => dateParseISO(a.start).valueOf() - dateParseISO(b.start).valueOf(),
  );
}
