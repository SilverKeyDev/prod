/**
 * Scheduling utilities for Google Calendar scheduling MVP
 */

import type {
  FreebusyTimeBlock,
  TimeSlot,
  WorkingHours,
} from "../schemas/scheduling";

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
    const busyStart = new Date(busy.start).getTime();
    const busyEnd = new Date(busy.end).getTime();

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

  // Start from the beginning of startDate
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  // End at the end of endDate
  const finalDate = new Date(endDate);
  finalDate.setHours(23, 59, 59, 999);

  // Generate slots for each day
  while (currentDate <= finalDate) {
    const dayStart = new Date(currentDate);
    dayStart.setHours(hours.start, 0, 0, 0);

    const dayEnd = new Date(currentDate);
    dayEnd.setHours(hours.end, 0, 0, 0);

    // Generate slots for this day
    let slotStart = new Date(dayStart);
    while (slotStart < dayEnd) {
      const slotEndTime = new Date(slotStart);
      slotEndTime.setMinutes(slotEndTime.getMinutes() + slotDurationMinutes);

      // Don't create slots that extend beyond working hours
      if (slotEndTime > dayEnd) {
        break;
      }

      const slot: TimeSlot = {
        start: new Date(slotStart),
        end: new Date(slotEndTime),
        isAvailable: true,
      };

      // Check if slot is available (not conflicting with busy blocks)
      slot.isAvailable = isTimeSlotAvailable(slot, busyBlocks);

      slots.push(slot);

      // Move to next slot
      slotStart = new Date(slotEndTime);
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateToCheck = new Date(date);
  dateToCheck.setHours(0, 0, 0, 0);

  if (dateToCheck.getTime() === today.getTime()) {
    return "Today";
  } else if (dateToCheck.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  } else {
    return dateToLocaleDateString(date);
  }
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
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
}

