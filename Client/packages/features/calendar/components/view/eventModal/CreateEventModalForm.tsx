import type { ChangeEvent } from "react";

import { Button, CancelButton, ClientSelector } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BaseModal from "packages/ui/components/surfaces/modals/BaseModal";

import Label from "@/components/ui/text/Label.web";
import type { CreateEventMutualAvailability } from "@/features/calendar/hooks/data/createEvent/useCreateEventMutualAvailability";
import type { Calendar, ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { CalendarEventKindId } from "@/features/calendar/utils/createEventModal/calendarEventKinds";

import { CreateEventModalFormFields } from "./CreateEventModalFormFields";

export type CreateEventModalFormProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  modalTitle?: string;
  calendars: Calendar[];
  selectedCalendarId: string;
  onCalendarChange: (id: string) => void;
  hideCalendarPicker?: boolean;
  eventKindId: CalendarEventKindId;
  onEventKindIdChange: (id: CalendarEventKindId) => void;
  allowedKindIds: CalendarEventKindId[];
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
  addGoogleMeet: boolean;
  onAddGoogleMeetChange: (next: boolean) => void;
  showGoogleMeetOption: boolean;
  existingEvent?: ExtendedGoogleEvent;
  mutualSchedule: CreateEventMutualAvailability | null;
  onCalendarTimedSlotPick: (payload: { startTime: string; endTime: string }) => void;
  registerOutsideClickSafeTarget?: (element: HTMLElement) => () => void;
  /** Messaging calendar request: schedule is required (not an optional agenda to-do). */
  scheduleRequired?: boolean;
};

export type CreateEventModalFormCoreProps = Omit<
  CreateEventModalFormProps,
  | "isOpen"
  | "onClose"
  | "modalTitle"
  | "canSubmit"
  | "isSubmitting"
  | "primaryActionLabel"
  | "onSubmit"
>;

export function CreateEventModalFormCore(props: CreateEventModalFormCoreProps) {
  const {
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
    addGoogleMeet,
    onAddGoogleMeetChange,
    showGoogleMeetOption,
    existingEvent,
    mutualSchedule,
    onCalendarTimedSlotPick,
    registerOutsideClickSafeTarget,
    scheduleRequired = false,
  } = props;

  return (
    <Box className="space-y-4">
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

      <CreateEventModalFormFields
        mode={mode}
        calendars={calendars}
        selectedCalendarId={selectedCalendarId}
        onCalendarChange={onCalendarChange}
        hideCalendarPicker={hideCalendarPicker}
        eventKindId={eventKindId}
        onEventKindIdChange={onEventKindIdChange}
        allowedKindIds={allowedKindIds}
        eventTitle={eventTitle}
        onEventTitleChange={onEventTitleChange}
        isAllDay={isAllDay}
        onIsAllDayChange={onIsAllDayChange}
        startDate={startDate}
        endDate={endDate}
        onDateRangeChange={onDateRangeChange}
        startTime={startTime}
        endTime={endTime}
        onStartTimeChange={onStartTimeChange}
        onEndTimeChange={onEndTimeChange}
        eventLocation={eventLocation}
        onEventLocationChange={onEventLocationChange}
        locationScriptsReady={locationScriptsReady}
        loadError={loadError}
        eventDescription={eventDescription}
        onEventDescriptionChange={onEventDescriptionChange}
        addGoogleMeet={addGoogleMeet}
        onAddGoogleMeetChange={onAddGoogleMeetChange}
        showGoogleMeetOption={showGoogleMeetOption}
        existingEvent={existingEvent}
        mutualSchedule={mutualSchedule}
        onCalendarTimedSlotPick={onCalendarTimedSlotPick}
        registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
        scheduleRequired={scheduleRequired}
      />
    </Box>
  );
}

export function CreateEventModalForm({
  isOpen,
  onClose,
  mode,
  modalTitle,
  canSubmit,
  isSubmitting,
  primaryActionLabel,
  onSubmit,
  ...coreProps
}: CreateEventModalFormProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={modalTitle ?? (mode === "edit" ? "Edit Event" : "Add to Agenda")}
      showCloseButton
      showHeaderBorder
    >
      <Box className="space-y-4">
        <CreateEventModalFormCore {...coreProps} />

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
            {primaryActionLabel}
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
}
