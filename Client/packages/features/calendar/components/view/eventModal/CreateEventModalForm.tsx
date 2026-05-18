import type { ChangeEvent } from "react";

import { Button, CancelButton, ClientSelector } from "packages/ui";
import BaseModal from "packages/ui/components/modals/BaseModal";
import { Box } from "packages/ui/components/primitives";

import Label from "@/components/ui/text/Label.web";
import type { ViewingStop } from "@/features/calendar/components/viewings/ViewingStopList";
import type { CreateEventMutualAvailability } from "@/features/calendar/hooks/data/createEvent/useCreateEventMutualAvailability";
import type { Calendar } from "@/features/calendar/types/calendar";
import type { CalendarEventKindOptionSlice } from "@/features/calendar/utils/createEventModal/calendarEventKindOptions";
import type { CalendarEventKindId } from "@/features/calendar/utils/createEventModal/calendarEventKinds";
import type {
  ViewingRouteEndMode,
  ViewingRouteEndpoint,
  ViewingTourAnchor,
  ViewingTourStartSelection,
} from "@/features/calendar/utils/viewing/viewingRoutePlan";

import { CreateEventModalFormFields } from "./CreateEventModalFormFields";

export type CreateEventModalFormProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  /** When set, replaces the default "Add to Agenda" / "Edit Event" modal title. */
  modalTitle?: string;
  calendars: Calendar[];
  selectedCalendarId: string;
  onCalendarChange: (id: string) => void;
  /** Hide calendar dropdown (create uses default SilverKey calendar only). */
  hideCalendarPicker?: boolean;
  eventKindId: CalendarEventKindId;
  onEventKindIdChange: (id: CalendarEventKindId) => void;
  kindOptionSlice: CalendarEventKindOptionSlice;
  checklistProgressLoading?: boolean;
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
  canSubmit: boolean;
  isSubmitting: boolean;
  primaryActionLabel: string;
  onSubmit: () => void;
  addGoogleMeet: boolean;
  onAddGoogleMeetChange: (next: boolean) => void;
  showGoogleMeetOption: boolean;
  mutualSchedule: CreateEventMutualAvailability | null;
  onCalendarTimedSlotPick: (payload: { startTime: string; endTime: string }) => void;
  /** Portaled pickers (week create popover, quick event) register menu roots for outside-click guards. */
  registerOutsideClickSafeTarget?: (element: HTMLElement) => () => void;
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

export function CreateEventModalFormCore({
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
  onCalendarTimedSlotPick,
  registerOutsideClickSafeTarget,
}: CreateEventModalFormCoreProps) {
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
        kindOptionSlice={kindOptionSlice}
        checklistProgressLoading={checklistProgressLoading}
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
        isPropertyViewing={isPropertyViewing}
        viewingStops={viewingStops}
        onViewingStopsChange={onViewingStopsChange}
        viewingStartSelection={viewingStartSelection}
        onViewingStartSelectionChange={onViewingStartSelectionChange}
        viewingEndMode={viewingEndMode}
        onViewingEndModeChange={onViewingEndModeChange}
        viewingEndFixed={viewingEndFixed}
        onViewingEndFixedChange={onViewingEndFixedChange}
        viewingTourAnchors={viewingTourAnchors}
        eventLocation={eventLocation}
        onEventLocationChange={onEventLocationChange}
        locationScriptsReady={locationScriptsReady}
        loadError={loadError}
        eventDescription={eventDescription}
        onEventDescriptionChange={onEventDescriptionChange}
        addGoogleMeet={addGoogleMeet}
        onAddGoogleMeetChange={onAddGoogleMeetChange}
        showGoogleMeetOption={showGoogleMeetOption}
        mutualSchedule={mutualSchedule}
        onCalendarTimedSlotPick={onCalendarTimedSlotPick}
        registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
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
