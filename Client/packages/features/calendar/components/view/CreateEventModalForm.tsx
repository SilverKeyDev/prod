import { Icon } from "@ui/icons";
import type { ChangeEvent } from "react";

import type { Calendar } from "packages/features/calendar/types/calendar";
import type { AutocompleteSuggestion } from "packages/types/google-maps";
import Button from "packages/ui/components/button/Button";
import CancelButton from "packages/ui/components/button/CancelButton";
import Dropdown from "packages/ui/components/form/Dropdown";
import { Textarea } from "packages/ui/components/form/FormField";
import { Box } from "packages/ui/components/primitives";

import BaseModal from "@/components/modals/BaseModal";
import { BodyText, CloseButton, DateInput, Input, TimeInput } from "@/components/ui";
import Label from "@/components/ui/text/Label.web";

export type LocationSuggestion = {
  description: string;
  placePrediction: AutocompleteSuggestion["placePrediction"];
};

export type CreateEventModalFormProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  calendars: Calendar[];
  selectedCalendarId: string;
  onCalendarChange: (id: string) => void;
  eventTitle: string;
  onEventTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  startDate: string;
  onStartDateChange: (e: ChangeEvent<HTMLInputElement>) => void;
  startTime: string;
  onStartTimeChange: (e: ChangeEvent<HTMLInputElement>) => void;
  endDate: string;
  onEndDateChange: (e: ChangeEvent<HTMLInputElement>) => void;
  endTime: string;
  onEndTimeChange: (e: ChangeEvent<HTMLInputElement>) => void;
  eventLocation: string;
  onEventLocationChange: (e: ChangeEvent<HTMLInputElement>) => void;
  locationSuggestions: LocationSuggestion[];
  onLocationSelect: (s: LocationSuggestion) => void;
  loadError: string | null;
  eventDescription: string;
  onEventDescriptionChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  isCreatingEvent: boolean;
  isUpdatingEvent: boolean;
  onSubmit: () => void;
};

export function CreateEventModalForm({
  isOpen,
  onClose,
  mode,
  calendars,
  selectedCalendarId,
  onCalendarChange,
  eventTitle,
  onEventTitleChange,
  startDate,
  onStartDateChange,
  startTime,
  onStartTimeChange,
  endDate,
  onEndDateChange,
  endTime,
  onEndTimeChange,
  eventLocation,
  onEventLocationChange,
  locationSuggestions,
  onLocationSelect,
  loadError,
  eventDescription,
  onEventDescriptionChange,
  canSubmit,
  isSubmitting,
  isCreatingEvent,
  isUpdatingEvent,
  onSubmit,
}: CreateEventModalFormProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size="md">
      <Box className="space-y-4">
        <Box className="border-border flex items-center justify-between border-b pb-3">
          <Label as="h3" htmlFor="event-title" className="text-text-primary text-base font-medium">
            {mode === "edit" ? "Edit Event" : "Create New Event"}
          </Label>
          <CloseButton onClick={onClose} size="overlay" className="ml-2" />
        </Box>
        {calendars.length > 1 && (
          <Dropdown
            label="Calendar"
            options={calendars.map((cal) => ({
              value: cal.id,
              label: cal.summary,
            }))}
            value={selectedCalendarId}
            onChange={(id) => onCalendarChange(id)}
          />
        )}

        <Box>
          <Label htmlFor="event-title" required>
            Event Title
          </Label>
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

        <Box className="grid grid-cols-2 gap-3">
          <DateInput
            id="start-date"
            label="Start Date"
            required
            value={startDate}
            onChange={onStartDateChange}
          />
          <TimeInput
            id="start-time"
            label="Start Time"
            required
            value={startTime}
            onChange={onStartTimeChange}
          />
        </Box>

        <Box className="grid grid-cols-2 gap-3">
          <DateInput
            id="end-date"
            label="End Date"
            required
            value={endDate}
            min={startDate}
            onChange={onEndDateChange}
          />
          <TimeInput
            id="end-time"
            label="End Time"
            required
            value={endTime}
            onChange={onEndTimeChange}
          />
        </Box>

        <Box>
          <Label htmlFor="event-location">Location (optional)</Label>
          <Input
            id="event-location"
            value={eventLocation}
            onChange={onEventLocationChange}
            placeholder="e.g., 123 Main St, City, State"
            className="mt-1"
            autoComplete="off"
          />
          {loadError && (
            <BodyText as="p" size="xs" className="text-destructive mt-1">
              {loadError} You can still type an address manually.
            </BodyText>
          )}
          {locationSuggestions.length > 0 && (
            <ul className="bg-background-surface relative z-50 mt-2 flex max-h-60 flex-col gap-1 overflow-hidden overflow-y-auto rounded-md shadow-sm">
              {locationSuggestions.map((s, idx) => (
                <li
                  key={s.placePrediction.text.text + idx}
                  className="rounded border border-dotted border-neutral-300"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLocationSelect(s)}
                    className="hover:bg-primary-muted w-full cursor-pointer !justify-start px-3 py-2 text-sm [&>div>div]:!justify-start [&>div>div]:!text-left [&>div]:w-full [&>div]:!justify-start"
                  >
                    <Box className="flex w-full items-center justify-start gap-2 text-left">
                      <Icon name="map-pin" className="h-4 w-4 shrink-0 text-neutral-500" />
                      <BodyText as="span" size="sm" className="min-w-0 flex-1 text-left">
                        {s.description}
                      </BodyText>
                    </Box>
                  </Button>
                </li>
              ))}
            </ul>
          )}
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

        <Box className="flex gap-3 pt-2">
          <CancelButton onClick={onClose} className="flex-1" disabled={isSubmitting}>
            Cancel
          </CancelButton>
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting}
            loading={isSubmitting}
            className="flex-1"
          >
            {mode === "edit"
              ? isUpdatingEvent
                ? "Updating..."
                : "Update Event"
              : isCreatingEvent
                ? "Creating..."
                : "Create Event"}
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
}
