import {
  dateNow,
  dayjs,
  formatLocaleLongWeekdayMonthDayEnUs,
  formatLocaleLongWeekdayMonthDayYearEnUs,
  formatLocaleTime12HourEnUs,
} from "packages/utils/core/date";

/**
 * Utility functions for formatting dates in message lists
 * Implements iMessage-style date dividers
 */

/**
 * Formats a date for display in message date dividers
 * Returns: time (if within 24 hours), "Today", "Yesterday", "Monday, January 1", or "Monday, January 1, 2024"
 */
export function formatMessageDateHeader(date: Date): string {
  const now = dateNow();
  const messageDate = dayjs(date);

  // Calculate time difference in hours
  const timeDiffInMs = now.valueOf() - messageDate.valueOf();
  const timeDiffInHours = timeDiffInMs / (1000 * 60 * 60);

  // If within the last 24 hours, show time
  if (timeDiffInHours < 24 && timeDiffInHours >= 0) {
    return formatLocaleTime12HourEnUs(messageDate.toDate());
  }

  // Check calendar days for "Today" and "Yesterday"
  const today = dateNow().startOf("day");
  const yesterday = today.subtract(1, "day");
  const messageDateOnly = messageDate.startOf("day");

  // Check if it's today
  if (messageDateOnly.valueOf() === today.valueOf()) {
    return "Today";
  }

  // Check if it's yesterday
  if (messageDateOnly.valueOf() === yesterday.valueOf()) {
    return "Yesterday";
  }

  // Check if it's this year
  const isThisYear = messageDate.year() === now.year();

  const asDate = messageDate.toDate();
  return isThisYear
    ? formatLocaleLongWeekdayMonthDayEnUs(asDate)
    : formatLocaleLongWeekdayMonthDayYearEnUs(asDate);
}

/**
 * Determines if a date divider should be shown between two messages
 * Returns true if:
 * - There's a large time gap (hours/days) between messages
 * - The conversation spans across calendar days (midnight boundary)
 *
 * Returns false if:
 * - Messages are sent close together (minutes apart)
 * - Messages are on the same day and close in time
 */
export function shouldShowDateDivider(
  currentMessageDate: Date,
  previousMessageDate: Date | null
): boolean {
  // If there's no previous message, don't show a divider
  if (!previousMessageDate) {
    return false;
  }

  const current = dayjs(currentMessageDate);
  const previous = dayjs(previousMessageDate);

  // Check if messages are on different calendar days
  const currentDateOnly = current.startOf("day");
  const previousDateOnly = previous.startOf("day");

  // Show divider if dates are different (crosses midnight boundary)
  if (currentDateOnly.valueOf() !== previousDateOnly.valueOf()) {
    return true;
  }

  // Check for large time gap (more than 1 hour) on the same day
  const timeDiffInMs = current.valueOf() - previous.valueOf();
  const timeDiffInHours = timeDiffInMs / (1000 * 60 * 60);

  // Show divider if there's a gap of more than 1 hour
  if (timeDiffInHours > 1) {
    return true;
  }

  // Don't show divider for messages close together
  return false;
}

/**
 * Gets the date header text for a message if a divider should be shown
 * Returns the formatted date string or null if no divider should be shown
 */
export function getDateDividerText(
  messageDate: Date,
  previousMessageDate: Date | null
): string | null {
  if (shouldShowDateDivider(messageDate, previousMessageDate)) {
    return formatMessageDateHeader(messageDate);
  }
  return null;
}

/**
 * Determines if a message should show its timestamp
 * Returns true if:
 * - It's the first message (no previous message)
 * - The previous message has a different date
 * - There's a meaningful time gap (>5 minutes) between messages
 * - The previous message is from a different sender (role change)
 *
 * Returns false if:
 * - Messages are sent close together (within 5 minutes) on the same day
 * - The timestamp would be identical to the previous message
 */
export function shouldShowMessageTimestamp(
  currentMessageDate: Date,
  currentMessageRole: "user" | "agent",
  previousMessageDate: Date | null,
  previousMessageRole: "user" | "agent" | null
): boolean {
  // Always show timestamp for the first message
  if (!previousMessageDate || !previousMessageRole) {
    return true;
  }

  const current = dayjs(currentMessageDate);
  const previous = dayjs(previousMessageDate);

  // Show timestamp if sender changed (user -> agent or agent -> user)
  if (currentMessageRole !== previousMessageRole) {
    return true;
  }

  // Check if messages are on different calendar days
  const currentDateOnly = current.startOf("day");
  const previousDateOnly = previous.startOf("day");

  // Show timestamp if dates are different
  if (currentDateOnly.valueOf() !== previousDateOnly.valueOf()) {
    return true;
  }

  // Check time difference in minutes
  const timeDiffInMs = current.valueOf() - previous.valueOf();
  const timeDiffInMinutes = timeDiffInMs / (1000 * 60);

  // Show timestamp if there's a gap of more than 5 minutes
  if (timeDiffInMinutes > 5) {
    return true;
  }

  // Check if timestamps would be identical (same hour and minute)
  const currentHour = current.getHours();
  const currentMinute = current.getMinutes();
  const previousHour = previous.getHours();
  const previousMinute = previous.getMinutes();

  // Show timestamp if hour or minute changed
  if (currentHour !== previousHour || currentMinute !== previousMinute) {
    return true;
  }

  // Hide timestamp for messages sent within 5 minutes with same time display
  return false;
}
