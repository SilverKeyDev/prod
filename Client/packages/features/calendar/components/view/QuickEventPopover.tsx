import {
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
} from "react";
import { createPortal } from "react-dom";

import { color, spacing } from "packages/design-tokens";
import Button from "packages/ui/components/button/Button";
import ClientSelector from "packages/ui/components/button/ClientSelector";
import Dropdown from "packages/ui/components/form/dropdown";
import OliveCheckbox from "packages/ui/components/form/OliveCheckbox";
import { Box } from "packages/ui/components/primitives";
import Input from "packages/ui/components/primitives/input/Input";
import Label from "packages/ui/components/text/Label.web";
import { getDocument, getWindow } from "packages/utils/platform";

import { Title } from "@/components/ui";
import { CalendarStyleDateRangePicker } from "@/features/calendar/components/eventForm/CalendarStyleDateRangePicker";
import { EventFormTimeRange } from "@/features/calendar/components/eventForm/EventFormTimeRange";
import type { Calendar } from "@/features/calendar/types/calendar";

export type QuickEventPopoverAnchorRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type QuickEventPopoverProps = {
  anchorRect: QuickEventPopoverAnchorRect | null;
  eventTitle: string;
  onEventTitleChange: (next: string) => void;
  eventDescription: string;
  onEventDescriptionChange: (next: string) => void;
  eventLocation: string;
  onEventLocationChange: (next: string) => void;
  isAllDay: boolean;
  onIsAllDayChange: (next: boolean) => void;
  startDate: string;
  endDate: string;
  onDateRangeChange: (startYmd: string, endYmd: string) => void;
  startTime: string;
  endTime: string;
  onStartTimeChange: (hhmm: string) => void;
  onEndTimeChange: (hhmm: string) => void;
  calendars: Calendar[];
  selectedCalendarId: string;
  onCalendarChange: (id: string) => void;
  hideCalendarPicker: boolean;
  showAgentClientPicker: boolean;
  selectedClientId: string | null;
  onSelectedClientIdChange: (id: string | null) => void;
  isSubmitting: boolean;
  onCommit: () => void;
  onEditDetails?: () => void;
  /** Profile availability: offer weekly recurrence for week-sourced quick create. */
  showWeeklyRepeatToggle?: boolean;
  repeatWeekly?: boolean;
  onRepeatWeeklyChange?: (next: boolean) => void;
};

export function QuickEventPopover({
  anchorRect,
  eventTitle,
  onEventTitleChange,
  eventDescription,
  onEventDescriptionChange,
  eventLocation,
  onEventLocationChange,
  isAllDay,
  onIsAllDayChange,
  startDate,
  endDate,
  onDateRangeChange,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  calendars,
  selectedCalendarId,
  onCalendarChange,
  hideCalendarPicker,
  showAgentClientPicker,
  selectedClientId,
  onSelectedClientIdChange,
  isSubmitting,
  onCommit,
  onEditDetails,
  showWeeklyRepeatToggle = false,
  repeatWeekly = false,
  onRepeatWeeklyChange,
}: QuickEventPopoverProps) {
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const panelId = useId();

  useEffect(() => {
    if (!anchorRect) {
      return;
    }
    const el = titleInputRef.current;
    if (!el) {
      return;
    }
    el.focus();
    el.select();
  }, [anchorRect]);

  const onTitleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onCommit();
      }
    },
    [onCommit]
  );

  const win = getWindow();
  const doc = getDocument();
  if (!anchorRect || !win || !doc?.body) {
    return null;
  }

  const panelStyle: CSSProperties = {
    position: "fixed",
    top: Math.min(anchorRect.top + anchorRect.height + 8, win.innerHeight - 320),
    left: Math.max(8, Math.min(anchorRect.left, win.innerWidth - 340)),
    width: 320,
    maxHeight: "min(420px, 85vh)",
    overflowY: "auto",
    zIndex: 60,
    backgroundColor: color("neutral.50"),
    borderWidth: 1,
    borderColor: color("neutral.200"),
    borderRadius: spacing(2),
    padding: spacing(3),
    boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
  };

  return createPortal(
    <Box data-silverkey-quick-event-popover="" id={panelId} style={panelStyle}>
      <Title size="sm" as="h2" className="sr-only">
        Quick event
      </Title>
      <Box className="flex flex-col gap-3">
        <Label htmlFor={`${panelId}-title`}>Title</Label>
        <Input
          ref={titleInputRef}
          id={`${panelId}-title`}
          value={eventTitle}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onEventTitleChange(e.target.value)}
          onKeyDown={onTitleKeyDown}
          className="mt-1 rounded border border-neutral-200 px-2 py-1.5 text-base"
          disabled={isSubmitting}
        />

        {showAgentClientPicker ? (
          <Box>
            <Label className="mb-2 block">Client</Label>
            <ClientSelector
              selectedClientId={selectedClientId}
              onClientChange={onSelectedClientIdChange}
              className="w-full max-w-full [&_button]:w-full"
            />
          </Box>
        ) : null}

        <CalendarStyleDateRangePicker
          id={`${panelId}-dates`}
          label="Date"
          required
          startDate={startDate}
          endDate={endDate}
          onRangeChange={onDateRangeChange}
        />

        {isAllDay ? (
          <Box className="flex items-center gap-2">
            <OliveCheckbox checked={isAllDay} onToggle={() => onIsAllDayChange(false)} />
            <Label className="mb-0">All day</Label>
          </Box>
        ) : (
          <EventFormTimeRange
            startDate={startDate}
            endDate={endDate}
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={onStartTimeChange}
            onEndTimeChange={onEndTimeChange}
            menuInPortal
            menuPortalStack="modal"
            menuPlacement="below"
            trailingSlot={
              <Box className="flex items-center gap-2">
                <OliveCheckbox checked={isAllDay} onToggle={() => onIsAllDayChange(true)} />
                <Label className="mb-0 text-xs">All day</Label>
              </Box>
            }
          />
        )}

        {!hideCalendarPicker && calendars.length > 1 ? (
          <Dropdown
            label="Calendar"
            options={calendars.map((cal) => ({
              value: cal.id,
              label: cal.summary,
            }))}
            value={selectedCalendarId}
            onChange={(id) => onCalendarChange(id)}
          />
        ) : null}

        <Box>
          <Label htmlFor={`${panelId}-loc`}>Location (optional)</Label>
          <Input
            id={`${panelId}-loc`}
            value={eventLocation}
            onChange={(e) => onEventLocationChange(e.target.value)}
            className="mt-1 rounded border border-neutral-200 px-2 py-1.5 text-base"
            placeholder="Add location"
          />
        </Box>

        <Box>
          <Label htmlFor={`${panelId}-notes`}>Notes (optional)</Label>
          <Input
            id={`${panelId}-notes`}
            value={eventDescription}
            onChange={(e) => onEventDescriptionChange(e.target.value)}
            className="mt-1 rounded border border-neutral-200 px-2 py-1.5 text-base"
            placeholder="Add notes"
          />
        </Box>

        {showWeeklyRepeatToggle && onRepeatWeeklyChange ? (
          <Box className="flex items-center gap-2">
            <OliveCheckbox
              checked={repeatWeekly}
              onToggle={() => onRepeatWeeklyChange(!repeatWeekly)}
            />
            <Label className="mb-0 text-xs">Repeat every week</Label>
          </Box>
        ) : null}

        {onEditDetails ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start px-0"
            onPress={onEditDetails}
          >
            Edit details…
          </Button>
        ) : null}

        <Box className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onPress={onCommit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </Box>
      </Box>
    </Box>,
    doc.body
  );
}
