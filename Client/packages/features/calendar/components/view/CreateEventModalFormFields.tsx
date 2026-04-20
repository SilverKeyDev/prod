import type { ChangeEvent } from "react";

import { color } from "packages/design-tokens";
import Button from "packages/ui/components/button/Button";
import Dropdown from "packages/ui/components/form/dropdown";
import { Textarea } from "packages/ui/components/form/FormField";
import { GooglePlacesAutocompleteField } from "packages/ui/components/form/GooglePlacesAutocompleteField";
import OliveCheckbox from "packages/ui/components/form/OliveCheckbox";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Input } from "@/components/ui";
import Label from "@/components/ui/text/Label.web";
import { CalendarStyleDateRangePicker } from "@/features/calendar/components/eventForm/CalendarStyleDateRangePicker";
import { EventFormTimeRange } from "@/features/calendar/components/eventForm/EventFormTimeRange";
import {
  type ViewingStop,
  ViewingStopList,
} from "@/features/calendar/components/viewings/ViewingStopList";
import type { Calendar } from "@/features/calendar/types/calendar";
import type { CalendarEventKindOptionSlice } from "@/features/calendar/utils/createEventModal/calendarEventKindOptions";
import {
  CALENDAR_EVENT_KINDS,
  type CalendarEventKindId,
} from "@/features/calendar/utils/createEventModal/calendarEventKinds";

export type CreateEventModalFormFieldsProps = {
  mode: "create" | "edit";
  calendars: Calendar[];
  selectedCalendarId: string;
  onCalendarChange: (id: string) => void;
  hideCalendarPicker?: boolean;
  eventKindId: CalendarEventKindId;
  onEventKindIdChange: (id: CalendarEventKindId) => void;
  kindOptionSlice: CalendarEventKindOptionSlice;
  checklistProgressLoading?: boolean;
  showAgentMultiStopViewingToggle?: boolean;
  agentMultiStopViewing?: boolean;
  onAgentMultiStopViewingChange?: (next: boolean) => void;
  eventTitle: string;
  onEventTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  isAllDay: boolean;
  onIsAllDayChange: (next: boolean) => void;
  startDate: string;
  endDate: string;
  onDateRangeChange: (startYmd: string, endYmd: string) => void;
  startTime: string;
  endTime: string;
  onStartTimeChange: (hhmm: string) => void;
  onEndTimeChange: (hhmm: string) => void;
  isPropertyViewing?: boolean;
  viewingStops?: ViewingStop[];
  onViewingStopsChange?: (next: ViewingStop[]) => void;
  eventLocation: string;
  onEventLocationChange: (value: string) => void;
  locationScriptsReady: boolean;
  loadError: string | null;
  eventDescription: string;
  onEventDescriptionChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
};

export function CreateEventModalFormFields({
  mode,
  calendars,
  selectedCalendarId,
  onCalendarChange,
  hideCalendarPicker = false,
  eventKindId,
  onEventKindIdChange,
  kindOptionSlice,
  checklistProgressLoading = false,
  showAgentMultiStopViewingToggle = false,
  agentMultiStopViewing = false,
  onAgentMultiStopViewingChange,
  eventTitle,
  onEventTitleChange,
  isAllDay,
  onIsAllDayChange,
  startDate,
  endDate,
  onDateRangeChange,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  isPropertyViewing = false,
  viewingStops = [],
  onViewingStopsChange,
  eventLocation,
  onEventLocationChange,
  locationScriptsReady,
  loadError,
  eventDescription,
  onEventDescriptionChange,
}: CreateEventModalFormFieldsProps) {
  const hasAnyScheduleDate = Boolean(
    (startDate?.trim() ?? "").length > 0 || (endDate?.trim() ?? "").length > 0
  );
  const scheduleDetailsVisible = mode === "edit" || hasAnyScheduleDate;
  const showCustomTitle = eventKindId === "other";

  const kindDropdownOptions = kindOptionSlice.allowedKindIds.map((id) => ({
    value: id,
    label: CALENDAR_EVENT_KINDS[id].label,
    icon: (
      <BodyText
        as="span"
        className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-sm"
        style={{
          backgroundColor: color(CALENDAR_EVENT_KINDS[id].uiColorPath),
        }}
        aria-hidden
      >
        {"\u200b"}
      </BodyText>
    ),
  }));

  return (
    <>
      <Dropdown<CalendarEventKindId>
        label="Event type"
        options={kindDropdownOptions}
        value={eventKindId}
        onChange={onEventKindIdChange}
        disabled={checklistProgressLoading}
        menuInPortal
        menuPortalStack="modal"
        menuPlacement="below"
      />

      {mode === "create" && showAgentMultiStopViewingToggle && onAgentMultiStopViewingChange ? (
        <Box className="flex items-start gap-3">
          <OliveCheckbox
            checked={agentMultiStopViewing}
            onToggle={() => onAgentMultiStopViewingChange(!agentMultiStopViewing)}
          />
          <Box className="min-w-0 flex-1">
            <Label className="mb-0 block">Multiple property viewing stops</Label>
            <BodyText as="p" size="xs" className="text-text-secondary mt-1">
              Add one address per stop. The fastest driving order is computed when you save. Leave
              off for a single location.
            </BodyText>
          </Box>
        </Box>
      ) : null}

      {showCustomTitle ? (
        <Box>
          <Label htmlFor="event-title">Event title</Label>
          <Input
            id="event-title"
            value={eventTitle}
            onChange={onEventTitleChange}
            placeholder="e.g., Meet lender, Contractor walkthrough"
            className="mt-1"
            // eslint-disable-next-line jsx-a11y/no-autofocus -- Focus when custom title is required
            autoFocus
          />
        </Box>
      ) : null}

      <Box>
        <Label htmlFor="event-description">Description (optional)</Label>
        <Textarea
          id="event-description"
          value={eventDescription}
          onChange={onEventDescriptionChange}
          placeholder="Event details (optional)"
          rows={3}
          className="mt-1"
        />
      </Box>

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
        <CalendarStyleDateRangePicker
          id="event-date-range"
          label={mode === "edit" ? "Dates" : "Add to calendar"}
          required={mode === "edit"}
          helperText={
            mode === "create"
              ? "Optional. Leave empty for a to-do without a scheduled time."
              : undefined
          }
          startDate={startDate}
          endDate={endDate}
          onRangeChange={onDateRangeChange}
          onClear={mode === "create" ? () => onDateRangeChange("", "") : undefined}
        />
      </Box>

      {scheduleDetailsVisible ? (
        isAllDay ? (
          <Box className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-text-primary h-auto min-h-0 px-0 py-0 font-medium"
              onClick={() => onIsAllDayChange(!isAllDay)}
            >
              All day
            </Button>
            <OliveCheckbox checked={isAllDay} onToggle={() => onIsAllDayChange(!isAllDay)} />
          </Box>
        ) : (
          <EventFormTimeRange
            startDate={startDate}
            endDate={endDate}
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={onStartTimeChange}
            onEndTimeChange={onEndTimeChange}
            menuPlacement="overlap"
            menuInPortal
            menuPortalStack="modal"
            trailingSlot={
              <Box className="flex shrink-0 items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-text-primary h-auto min-h-0 px-0 py-0 font-medium"
                  onClick={() => onIsAllDayChange(!isAllDay)}
                >
                  All day
                </Button>
                <OliveCheckbox checked={isAllDay} onToggle={() => onIsAllDayChange(!isAllDay)} />
              </Box>
            }
          />
        )
      ) : null}

      <Box>
        {isPropertyViewing && onViewingStopsChange ? (
          <ViewingStopList
            stops={viewingStops}
            onStopsChange={onViewingStopsChange}
            scriptsReady={locationScriptsReady}
            loadError={loadError}
          />
        ) : (
          <>
            <GooglePlacesAutocompleteField
              label="Location (optional)"
              value={eventLocation}
              onChange={onEventLocationChange}
              onSelect={(data) => onEventLocationChange(data.address)}
              scriptsReady={locationScriptsReady}
              placeholder="Search for an address or type a place or link"
            />
            {loadError ? (
              <BodyText as="p" size="xs" className="text-destructive mt-1">
                {loadError} You can still type an address or link manually.
              </BodyText>
            ) : null}
          </>
        )}
      </Box>
    </>
  );
}
