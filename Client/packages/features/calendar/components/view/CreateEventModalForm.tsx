import type { ChangeEvent } from "react";

import Button from "packages/ui/components/button/Button";
import CancelButton from "packages/ui/components/button/CancelButton";
import ClientSelector from "packages/ui/components/button/ClientSelector";
import { AddressInput } from "packages/ui/components/form/AddressInput";
import Dropdown from "packages/ui/components/form/Dropdown";
import { Textarea } from "packages/ui/components/form/FormField";
import OliveCheckbox from "packages/ui/components/form/OliveCheckbox";
import { Box } from "packages/ui/components/primitives";

import BaseModal from "@/components/modals/BaseModal";
import { BodyText, CloseButton, Input, Title } from "@/components/ui";
import Label from "@/components/ui/text/Label.web";
import { CalendarStyleDateRangePicker } from "@/features/calendar/components/eventForm/CalendarStyleDateRangePicker";
import { EventFormTimeRange } from "@/features/calendar/components/eventForm/EventFormTimeRange";
import type { Calendar } from "@/features/calendar/types/calendar";

export type CreateEventModalFormProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  calendars: Calendar[];
  selectedCalendarId: string;
  onCalendarChange: (id: string) => void;
  /** Hide calendar dropdown (create uses default SilverKey calendar only). */
  hideCalendarPicker?: boolean;
  eventTitle: string;
  onEventTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  showAgentClientPicker?: boolean;
  selectedClientId: string | null;
  onSelectedClientIdChange: (id: string | null) => void;
  isAllDay: boolean;
  onIsAllDayChange: (next: boolean) => void;
  startDate: string;
  endDate: string;
  onDateRangeChange: (startYmd: string, endYmd: string) => void;
  startTime: string;
  endTime: string;
  onStartTimeChange: (hhmm: string) => void;
  onEndTimeChange: (hhmm: string) => void;
  eventLocation: string;
  onEventLocationChange: (value: string) => void;
  locationScriptsReady: boolean;
  loadError: string | null;
  eventDescription: string;
  onEventDescriptionChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  primaryActionLabel: string;
  onSubmit: () => void;
};

export function CreateEventModalForm({
  isOpen,
  onClose,
  mode,
  calendars,
  selectedCalendarId,
  onCalendarChange,
  hideCalendarPicker = false,
  eventTitle,
  onEventTitleChange,
  showAgentClientPicker = false,
  selectedClientId,
  onSelectedClientIdChange,
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
  canSubmit,
  isSubmitting,
  primaryActionLabel,
  onSubmit,
}: CreateEventModalFormProps) {
  const hasAnyScheduleDate = Boolean(
    (startDate?.trim() ?? "").length > 0 || (endDate?.trim() ?? "").length > 0,
  );
  const scheduleDetailsVisible = mode === "edit" || hasAnyScheduleDate;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size="md">
      <Box className="space-y-4">
        <Box className="border-border flex items-center justify-between border-b pb-3">
          <Title size="md" as="h2">
            {mode === "edit" ? "Edit Event" : "Add to Agenda"}
          </Title>
          <CloseButton onClick={onClose} size="overlay" className="ml-2" />
        </Box>

        {mode === "create" && showAgentClientPicker ? (
          <Box>
            <Label className="mb-2 block">Client</Label>
            <ClientSelector
              selectedClientId={selectedClientId}
              onClientChange={onSelectedClientIdChange}
              className="w-full max-w-full [&_button]:w-full"
            />
          </Box>
        ) : null}

        <Box>
          <Label htmlFor="event-title">Event Title</Label>
          <Input
            id="event-title"
            value={eventTitle}
            onChange={onEventTitleChange}
            placeholder="e.g., Property Viewing, Home Inspection"
            className="mt-1"
            // eslint-disable-next-line jsx-a11y/no-autofocus -- Focus title when modal opens
            autoFocus
          />
        </Box>

        <Box>
          <Label htmlFor="event-description">Description (optional)</Label>
          <Textarea
            id="event-description"
            value={eventDescription}
            onChange={onEventDescriptionChange}
            placeholder="Add any additional details about the event..."
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
            onClear={
              mode === "create" ? () => onDateRangeChange("", "") : undefined
            }
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
              <OliveCheckbox
                checked={isAllDay}
                onToggle={() => onIsAllDayChange(!isAllDay)}
              />
            </Box>
          ) : (
            <EventFormTimeRange
              startDate={startDate}
              endDate={endDate}
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={onStartTimeChange}
              onEndTimeChange={onEndTimeChange}
              menuPlacement="above"
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
                  <OliveCheckbox
                    checked={isAllDay}
                    onToggle={() => onIsAllDayChange(!isAllDay)}
                  />
                </Box>
              }
            />
          )
        ) : null}

        <Box>
          <AddressInput
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
        </Box>

        <Box className="flex gap-3 pt-2">
          <CancelButton
            onClick={onClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </CancelButton>
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting}
            loading={isSubmitting}
            className="flex-1"
          >
            {primaryActionLabel}
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
}
