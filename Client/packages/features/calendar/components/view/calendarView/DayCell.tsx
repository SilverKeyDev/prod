import { useMemo } from "react";

import type { ExtendedGoogleEvent } from "packages/features/calendar/types/calendar";
import type { FreebusyTimeBlock } from "packages/schemas/scheduling";
import { Box } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import { BodyText, Button } from "@/components/ui";

import type { GridDay } from "./types";

type DayCellProps = {
  day: GridDay;
  index: number;
  onDateClick?: (date: Date) => void;
  silverKeyCalendarId?: string | null;
  showAvailability?: boolean;
};

function isAllDayEvent(event: ExtendedGoogleEvent): boolean {
  return Boolean(event.start?.date && !event.start?.dateTime);
}

function sortDayEvents(events: ExtendedGoogleEvent[]): ExtendedGoogleEvent[] {
  return [...events].sort((a, b) => {
    const aAllDay = isAllDayEvent(a);
    const bAllDay = isAllDayEvent(b);
    if (aAllDay && !bAllDay) return -1;
    if (!aAllDay && bAllDay) return 1;
    if (aAllDay && bAllDay) return 0;
    const aStart = a.start?.dateTime;
    const bStart = b.start?.dateTime;
    if (!aStart || !bStart) return 0;
    return dateParseISO(aStart).valueOf() - dateParseISO(bStart).valueOf();
  });
}

type DayItem =
  | { type: "event"; event: ExtendedGoogleEvent }
  | { type: "availability"; block: FreebusyTimeBlock };

function getDayItemSortKey(item: DayItem): number {
  if (item.type === "event") {
    if (isAllDayEvent(item.event)) return 0;
    const dt = item.event.start?.dateTime;
    return dt ? dateParseISO(dt).valueOf() : 0;
  }
  return dateParseISO(item.block.start).valueOf();
}

function buildDayItems(
  events: ExtendedGoogleEvent[],
  availability: FreebusyTimeBlock[],
  showAvailability: boolean
): DayItem[] {
  const eventItems: DayItem[] = sortDayEvents(events).map((event) => ({ type: "event", event }));
  const availabilityItems: DayItem[] = showAvailability
    ? availability.map((block) => ({ type: "availability", block }))
    : [];
  const combined = [...eventItems, ...availabilityItems];
  combined.sort((a, b) => getDayItemSortKey(a) - getDayItemSortKey(b));
  return combined;
}

function EventChip({
  event,
  isPast,
  silverKeyCalendarId,
}: {
  event: ExtendedGoogleEvent;
  isPast: boolean;
  silverKeyCalendarId?: string | null;
}) {
  const isSilverKeyEvent = silverKeyCalendarId && event.calendarId === silverKeyCalendarId;
  const isClientEvent = event.isClientEvent === true;
  const allDay = isAllDayEvent(event);
  const displayTitle = event.summary || "Untitled";
  const title = isClientEvent ? `Client: ${displayTitle}` : displayTitle;
  const tooltipText = allDay ? `All day: ${title}` : title;

  const baseClasses =
    "flex h-6 min-h-6 w-full min-w-0 items-center overflow-hidden rounded border-l-4 px-1 font-medium";
  const variantClasses = isSilverKeyEvent
    ? isPast
      ? "bg-accent-muted border-accent text-text-secondary"
      : "bg-accent-muted border-accent text-text-primary"
    : isPast
      ? "border-border bg-primary-muted text-text-secondary"
      : "border-border bg-primary-muted text-text-secondary";

  return (
    <Box className={`${baseClasses} ${variantClasses}`} title={tooltipText}>
      {allDay ? (
        <BodyText as="span" size="xs" muted className="block min-w-0 truncate font-medium">
          All day · {displayTitle}
        </BodyText>
      ) : (
        <Box className="flex w-full min-w-0 items-center overflow-hidden">
          {event.start.dateTime && (
            <BodyText as="span" size="xs" muted className="shrink-0 font-medium">
              {dateParseISO(event.start.dateTime).toDate().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
              {" · "}
            </BodyText>
          )}
          <BodyText as="span" size="xs" muted className="min-w-0 truncate font-medium">
            {displayTitle}
          </BodyText>
        </Box>
      )}
    </Box>
  );
}

function AvailabilityChip({ block, isPast }: { block: FreebusyTimeBlock; isPast: boolean }) {
  const startTime = dateParseISO(block.start).toDate();
  const endTime = dateParseISO(block.end).toDate();
  const timeStr = `${startTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })} - ${endTime.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;

  return (
    <Box
      className={`flex h-6 min-h-6 w-full min-w-0 items-center overflow-hidden rounded border-l-4 px-1 font-medium ${
        isPast
          ? "border-border bg-primary-muted text-text-secondary"
          : "border-border bg-primary-muted text-text-secondary"
      }`}
      title={`Client Busy: ${timeStr}`}
    >
      <BodyText as="span" size="xs" muted className="block min-w-0 truncate font-medium">
        {timeStr}
      </BodyText>
    </Box>
  );
}

export function DayCell({
  day,
  onDateClick,
  silverKeyCalendarId,
  showAvailability = false,
}: DayCellProps) {
  const dayNumber = day.date.getDate();
  const dayItems = useMemo(
    () => buildDayItems(day.events, day.availability, showAvailability),
    [day.events, day.availability, showAvailability]
  );
  const totalItems = dayItems.length;
  const visibleItems = dayItems.slice(0, 3);
  const showMoreIndicator = totalItems > 3;

  const borderClass = day.isFirstOfMonth
    ? "border-accent border-2 bg-background-surface"
    : day.isToday
      ? "border-primary bg-primary-muted border"
      : "border-border border bg-background-surface";

  const chipSlotHeight = "h-6 min-h-6";

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onDateClick?.(day.date)}
      className={`relative flex min-h-16 w-full min-w-0 flex-col items-start overflow-hidden rounded border p-1 text-left transition-colors sm:min-h-20 ${borderClass} ${day.isPast ? "opacity-50" : ""} hover:border-accent hover:bg-accent-muted ${onDateClick ? "cursor-pointer" : "cursor-default"} bg-transparent`}
    >
      <BodyText
        as="span"
        size="xs"
        className={`absolute left-1 top-1 font-medium sm:text-sm ${day.isPast ? "text-text-disabled" : "text-text-primary"} ${day.isToday ? "text-primary font-semibold" : ""} pointer-events-none`}
      >
        {dayNumber}
      </BodyText>

      <Box className="flex w-[80%] min-w-0 max-w-[80%] flex-col items-stretch gap-0.5 overflow-hidden pt-5">
        {[0, 1, 2].map((slotIndex) => {
          const item = visibleItems[slotIndex];
          if (!item) {
            return (
              <Box
                key={`empty-${slotIndex}`}
                className={`${chipSlotHeight} w-full min-w-0 shrink-0`}
                aria-hidden
              />
            );
          }
          if (item.type === "event") {
            return (
              <EventChip
                key={item.event.id ?? `event-${slotIndex}`}
                event={item.event}
                isPast={day.isPast}
                silverKeyCalendarId={silverKeyCalendarId}
              />
            );
          }
          return (
            <AvailabilityChip
              key={`availability-${slotIndex}`}
              block={item.block}
              isPast={day.isPast}
            />
          );
        })}
        <Box
          className={`flex ${chipSlotHeight} w-full min-w-0 shrink-0 items-center overflow-hidden px-1 text-xs ${day.isPast ? "text-text-disabled" : "text-text-secondary"}`}
        >
          {showMoreIndicator ? (
            <BodyText as="span" size="xs" muted>
              +{totalItems - 3} more
            </BodyText>
          ) : null}
        </Box>
      </Box>
    </Button>
  );
}
