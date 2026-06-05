import type { EventRequestPayload } from "packages/features/messaging/types/eventRequest";
import {
  dateParseISO,
  formatLocaleLongWeekdayMonthDayYearEnUs,
  formatLocaleTime12HourEnUs,
} from "packages/utils/core/date";

export type { EventRequestPayload } from "packages/features/messaging/types/eventRequest";

const EVENT_REQUEST_PREFIX = "__EVENT_REQUEST__";

/**
 * Parse event request from message content.
 * If the message starts with __EVENT_REQUEST__{...}, parses the first line and returns the payload.
 * Otherwise returns null.
 */
export function parseEventRequestPayload(content: string): EventRequestPayload | null {
  const trimmed = content?.trim();
  if (!trimmed || !trimmed.startsWith(EVENT_REQUEST_PREFIX)) {
    return null;
  }
  const firstLine = trimmed.split("\n")[0];
  const jsonStr = firstLine.slice(EVENT_REQUEST_PREFIX.length).trim();
  try {
    const parsed = JSON.parse(jsonStr) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "title" in parsed &&
      "start" in parsed &&
      "end" in parsed &&
      typeof (parsed as EventRequestPayload).title === "string" &&
      typeof (parsed as EventRequestPayload).start === "string" &&
      typeof (parsed as EventRequestPayload).end === "string"
    ) {
      const p = parsed as EventRequestPayload;
      return {
        title: p.title,
        start: p.start,
        end: p.end,
        description: typeof p.description === "string" ? p.description : undefined,
        location: typeof p.location === "string" ? p.location : undefined,
      };
    }
  } catch {
    // Invalid JSON or shape
  }
  return null;
}

/**
 * Build the full message content for an event request: structured first line + human-readable text.
 */
export function buildEventRequestMessage(payload: EventRequestPayload): string {
  const line = `${EVENT_REQUEST_PREFIX}${JSON.stringify(payload)}`;
  const startDate = dateParseISO(payload.start).toDate();
  const formattedDate = formatLocaleLongWeekdayMonthDayYearEnUs(startDate);
  const formattedTime = formatLocaleTime12HourEnUs(startDate);
  let human = `📅 Event Request: ${payload.title}\n\n`;
  human += `Date: ${formattedDate}\n`;
  human += `Time: ${formattedTime}\n`;
  if (payload.location?.trim()) {
    human += `\nLocation: ${payload.location.trim()}`;
  }
  if (payload.description?.trim()) {
    human += `\n\n${payload.description.trim()}`;
  }
  return `${line}\n\n${human}`;
}
