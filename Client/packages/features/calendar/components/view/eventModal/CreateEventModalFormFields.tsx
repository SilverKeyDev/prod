import type { ChangeEvent } from "react";

import { color } from "packages/design-tokens";
import {
  Dropdown,
  GooglePlacesAutocompleteField,
  OliveCheckbox,
  OliveCheckboxRowLabel,
  Textarea,
} from "packages/ui/components";
import { Icon } from "packages/ui/components/icons";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Input } from "@/components/ui";
import Label from "@/components/ui/text/Label.web";
import { CalendarStyleDateRangePicker } from "@/features/calendar/components/eventForm/CalendarStyleDateRangePicker";
import { EventFormTimeRange } from "@/features/calendar/components/eventForm/EventFormTimeRange";
import { ViewingRoutePlanEditor } from "@/features/calendar/components/viewings/ViewingRoutePlanEditor";
import {
  type ViewingStop,
  ViewingStopList,
} from "@/features/calendar/components/viewings/ViewingStopList";
import type { CreateEventMutualAvailability } from "@/features/calendar/hooks/data/createEvent/useCreateEventMutualAvailability";
import type { Calendar } from "@/features/calendar/types/calendar";
import type { CalendarEventKindOptionSlice } from "@/features/calendar/utils/createEventModal/calendarEventKindOptions";
import {
  CALENDAR_EVENT_KINDS,
  type CalendarEventKindId,
} from "@/features/calendar/utils/createEventModal/calendarEventKinds";
import type {
  ViewingRouteEndMode,
  ViewingRouteEndpoint,
  ViewingTourAnchor,
  ViewingTourStartSelection,
} from "@/features/calendar/utils/viewing/viewingRoutePlan";

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
  viewingStartSelection?: ViewingTourStartSelection;
  onViewingStartSelectionChange?: (next: ViewingTourStartSelection) => void;
  viewingEndMode?: ViewingRouteEndMode;
  onViewingEndModeChange?: (next: ViewingRouteEndMode) => void;
  viewingEndFixed?: ViewingRouteEndpoint | null;
  onViewingEndFixedChange?: (next: ViewingRouteEndpoint | null) => void;
  viewingTourAnchors?: ViewingTourAnchor[];
  eventLocation: string;
  onEventLocationChange: (value: string) => void;
  locationScriptsReady: boolean;
  loadError: string | null;
  eventDescription: string;
  onEventDescriptionChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  addGoogleMeet: boolean;
  onAddGoogleMeetChange: (next: boolean) => void;
  showGoogleMeetOption: boolean;
  mutualSchedule: CreateEventMutualAvailability | null;
  /** Create flow: week double-click already set times — omit manual time row. */
  createTimesChosenViaWeekSlot?: boolean;
  onCalendarTimedSlotPick: (payload: { startTime: string; endTime: string }) => void;
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
  viewingStartSelection = { kind: "omit" },
  onViewingStartSelectionChange,
  viewingEndMode = "last_property",
  onViewingEndModeChange,
  viewingEndFixed = null,
  onViewingEndFixedChange,
  viewingTourAnchors = [],
  eventLocation,
  onEventLocationChange,
  locationScriptsReady,
  loadError,
  eventDescription,
  onEventDescriptionChange,
  addGoogleMeet,
  onAddGoogleMeetChange,
  showGoogleMeetOption,
  mutualSchedule,
  createTimesChosenViaWeekSlot = false,
  onCalendarTimedSlotPick,
}: CreateEventModalFormFieldsProps) {
  const hasAnyScheduleDate = Boolean(
    (startDate?.trim() ?? "").length > 0 || (endDate?.trim() ?? "").length > 0
  );
  const scheduleDetailsVisible = mode === "edit" || hasAnyScheduleDate;
  const showTimeRangeInCreateFlow =
    mode === "create" && !isAllDay && hasAnyScheduleDate && !createTimesChosenViaWeekSlot;
  const showTimedRangeRow = mode === "edit" || showTimeRangeInCreateFlow;
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

      {mutualSchedule?.mutualUiEnabled ? (
        <Box className="space-y-2">
          {!mutualSchedule.hintsReady ? (
            <BodyText as="p" size="xs" className="text-text-secondary">
              Loading shared availability…
            </BodyText>
          ) : null}
          {mutualSchedule.hintsReady && mutualSchedule.buyerCannotLoadAgentGoogleBusy ? (
            <BodyText as="p" size="xs" className="text-text-secondary">
              Your agent&apos;s Google calendar isn&apos;t shown here; mutual highlights use your
              linked Google calendar only.
            </BodyText>
          ) : null}
        </Box>
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
          mutualAvailabilityEnabled={Boolean(mutualSchedule?.mutualUiEnabled)}
          mutualAvailabilityHintsReady={Boolean(mutualSchedule?.hintsReady)}
          mutualDayKeys={mutualSchedule?.mutualDayKeys}
          mutualAvailabilityPopoverHint={
            mutualSchedule?.mutualUiEnabled && mutualSchedule.hintsReady
              ? mutualSchedule.isTwoParty
                ? "Green: at least one time that day is free on both linked Google calendars (when connected)."
                : "Green: at least one time that day is free on your linked Google calendar."
              : undefined
          }
          calendars={calendars}
          initialLayout={mode === "create" ? "week" : "grid"}
          weekTimeSelectionEnabled={mode === "create" && !isAllDay}
          onTimedSlotPick={({ startTime, endTime }) => {
            onCalendarTimedSlotPick({ startTime, endTime });
          }}
        />
      </Box>

      {scheduleDetailsVisible ? (
        isAllDay ? (
          <Box className="flex items-center gap-2">
            <OliveCheckboxRowLabel onPress={() => onIsAllDayChange(!isAllDay)}>
              All day
            </OliveCheckboxRowLabel>
            <OliveCheckbox checked={isAllDay} onToggle={() => onIsAllDayChange(!isAllDay)} />
          </Box>
        ) : showTimedRangeRow ? (
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
            mutualTimeRange={
              mutualSchedule?.mutualUiEnabled
                ? {
                    hintsReady: mutualSchedule.hintsReady,
                    enabled: true,
                    viewerTimeZone: mutualSchedule.viewerTimeZone,
                    isMutualUtcRange: mutualSchedule.isMutualUtcRange,
                  }
                : undefined
            }
            trailingSlot={
              <Box className="flex shrink-0 items-center gap-2">
                <OliveCheckboxRowLabel onPress={() => onIsAllDayChange(!isAllDay)}>
                  All day
                </OliveCheckboxRowLabel>
                <OliveCheckbox checked={isAllDay} onToggle={() => onIsAllDayChange(!isAllDay)} />
              </Box>
            }
          />
        ) : (
          <Box className="flex items-center gap-2">
            <OliveCheckboxRowLabel onPress={() => onIsAllDayChange(true)}>
              All day
            </OliveCheckboxRowLabel>
            <OliveCheckbox checked={isAllDay} onToggle={() => onIsAllDayChange(true)} />
          </Box>
        )
      ) : null}

      {mode === "create" && showGoogleMeetOption ? (
        <Box className="flex items-center gap-2">
          <Icon name="video" className="text-text-secondary h-4 w-4 shrink-0" aria-hidden />
          <OliveCheckbox
            checked={addGoogleMeet}
            onToggle={() => onAddGoogleMeetChange(!addGoogleMeet)}
          />
          <OliveCheckboxRowLabel
            className="min-w-0 flex-1 font-normal"
            onPress={() => onAddGoogleMeetChange(!addGoogleMeet)}
          >
            Add Google Meet video conferencing
          </OliveCheckboxRowLabel>
        </Box>
      ) : null}

      <Box>
        {isPropertyViewing &&
        onViewingStopsChange &&
        onViewingStartSelectionChange &&
        onViewingEndModeChange &&
        onViewingEndFixedChange ? (
          <ViewingRoutePlanEditor
            viewingStops={viewingStops}
            onViewingStopsChange={onViewingStopsChange}
            startSelection={viewingStartSelection}
            onStartSelectionChange={onViewingStartSelectionChange}
            endMode={viewingEndMode}
            onEndModeChange={onViewingEndModeChange}
            endFixed={viewingEndFixed}
            onEndFixedChange={onViewingEndFixedChange}
            savedAnchors={viewingTourAnchors}
            scriptsReady={locationScriptsReady}
            loadError={loadError}
          />
        ) : isPropertyViewing && onViewingStopsChange ? (
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
