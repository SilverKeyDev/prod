import { color } from "packages/design-tokens";
import { Dropdown, OliveCheckbox, OliveCheckboxRowLabel, Textarea } from "packages/ui/components";
import { Icon } from "packages/ui/components/media/icons";
import { Box } from "packages/ui/components/structure/primitives";
import {
  isEventMeetLinkPending,
  resolveEventMeetLink,
} from "packages/utils/comms/calendar/parsing/eventMeetLink";

import { BodyText, Input } from "@/components/ui";
import Label from "@/components/ui/text/Label.web";
import { CalendarStyleDateRangePicker } from "@/features/calendar/components/eventForm/CalendarStyleDateRangePicker";
import { EventFormTimeRange } from "@/features/calendar/components/eventForm/EventFormTimeRange";
import { EventVirtualMeetLink } from "@/features/calendar/components/eventForm/EventVirtualMeetLink";
import type { CreateEventModalFormFieldsProps } from "@/features/calendar/components/view/eventModal/createEventModalFormFields.types";
import { CreateEventModalFormLocation } from "@/features/calendar/components/view/eventModal/CreateEventModalFormViewingOrLocation";
import {
  CALENDAR_EVENT_KINDS,
  type CalendarEventKindId,
} from "@/features/calendar/utils/createEventModal/calendarEventKinds";

export type { CreateEventModalFormFieldsProps } from "@/features/calendar/components/view/eventModal/createEventModalFormFields.types";

export function CreateEventModalFormFields({
  mode,
  calendars,
  selectedCalendarId,
  onCalendarChange,
  hideCalendarPicker = false,
  eventKindId,
  onEventKindIdChange,
  allowedKindIds,
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
  eventLocation,
  onEventLocationChange,
  locationScriptsReady,
  loadError,
  eventDescription,
  onEventDescriptionChange,
  addGoogleMeet,
  onAddGoogleMeetChange,
  showGoogleMeetOption,
  existingEvent,
  mutualSchedule,
  onCalendarTimedSlotPick,
  registerOutsideClickSafeTarget,
}: CreateEventModalFormFieldsProps) {
  const hasAnyScheduleDate = Boolean(
    (startDate?.trim() ?? "").length > 0 || (endDate?.trim() ?? "").length > 0
  );
  const showScheduleTimeControls = mode === "edit" || hasAnyScheduleDate || mode === "create";
  const showCustomTitle = eventKindId === "other";

  const kindDropdownOptions = allowedKindIds.map((id) => ({
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
        menuInPortal
        menuPortalStack="modal"
        menuPlacement="below"
        registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
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
          menuInPortal
          menuPortalStack="modal"
          registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
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
          registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
        />
      </Box>

      {showScheduleTimeControls ? (
        isAllDay ? (
          <Box className="flex items-center gap-2">
            <OliveCheckbox checked={isAllDay} onToggle={() => onIsAllDayChange(false)} />
            <OliveCheckboxRowLabel onPress={() => onIsAllDayChange(false)}>
              All day
            </OliveCheckboxRowLabel>
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
            registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
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
                <OliveCheckbox checked={isAllDay} onToggle={() => onIsAllDayChange(true)} />
                <OliveCheckboxRowLabel onPress={() => onIsAllDayChange(true)}>
                  All day
                </OliveCheckboxRowLabel>
              </Box>
            }
          />
        )
      ) : null}

      {showGoogleMeetOption ? (
        <Box className="space-y-2">
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
          {addGoogleMeet ? (
            <EventVirtualMeetLink
              meetLink={
                mode === "edit" && existingEvent ? resolveEventMeetLink(existingEvent) : null
              }
              pending={
                mode === "edit" && existingEvent ? isEventMeetLinkPending(existingEvent) : false
              }
              placeholderWhenEmpty={
                mode === "create" ? "Meet link will be added when you save" : undefined
              }
              className="pl-6"
            />
          ) : null}
        </Box>
      ) : null}

      <CreateEventModalFormLocation
        eventLocation={eventLocation}
        onEventLocationChange={onEventLocationChange}
        locationScriptsReady={locationScriptsReady}
        loadError={loadError}
      />
    </>
  );
}
