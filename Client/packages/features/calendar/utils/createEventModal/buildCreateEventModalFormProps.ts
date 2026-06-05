import type { ChangeEvent } from "react";

import type { CreateEventModalFormProps } from "@/features/calendar/components/view/eventModal/CreateEventModalForm";
import type { CreateEventMutualAvailability } from "@/features/calendar/hooks/data/createEvent/useCreateEventMutualAvailability";
import type { Calendar } from "@/features/calendar/types/calendar";
import type { CalendarEventKindId } from "@/features/calendar/utils/createEventModal/calendarEventKinds";

export type BuildCreateEventModalFormPropsInput = {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  calendars: Calendar[];
  selectedCalendarId: string;
  setSelectedCalendarId: (id: string) => void;
  eventKindId: CalendarEventKindId;
  handleEventKindIdChange: (id: CalendarEventKindId) => void;
  allowedKindIds: CalendarEventKindId[];
  eventTitle: string;
  setEventTitle: (v: string) => void;
  showAgentClientPicker: boolean;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  isAllDay: boolean;
  onIsAllDayChange: (next: boolean) => void;
  startDate: string;
  endDate: string;
  onDateRangeChange: (lo: string, hi: string) => void;
  startTime: string;
  endTime: string;
  setStartTime: (v: string) => void;
  setEndTime: (v: string) => void;
  eventLocation: string;
  handleEventLocationChange: (value: string) => void;
  locationScriptsReady: boolean;
  loadError: string | null;
  eventDescription: string;
  setEventDescription: (v: string) => void;
  canSubmit: boolean;
  formSubmitting: boolean;
  primaryActionLabel: string;
  handleSubmit: () => void | Promise<void>;
  addGoogleMeet: boolean;
  setAddGoogleMeet: (next: boolean) => void;
  showGoogleMeetOption: boolean;
  mutualSchedule: CreateEventMutualAvailability | null;
  onCalendarTimedSlotPick: (payload: { startTime: string; endTime: string }) => void;
  registerOutsideClickSafeTarget?: (element: HTMLElement) => () => void;
};

export function buildCreateEventModalFormProps(
  input: BuildCreateEventModalFormPropsInput
): CreateEventModalFormProps {
  return {
    isOpen: input.isOpen,
    onClose: input.onClose,
    mode: input.mode,
    calendars: input.calendars,
    selectedCalendarId: input.selectedCalendarId,
    onCalendarChange: input.setSelectedCalendarId,
    hideCalendarPicker: input.mode === "create",
    eventKindId: input.eventKindId,
    onEventKindIdChange: input.handleEventKindIdChange,
    allowedKindIds: input.allowedKindIds,
    eventTitle: input.eventTitle,
    onEventTitleChange: (e: ChangeEvent<HTMLInputElement>) => input.setEventTitle(e.target.value),
    showAgentClientPicker: input.showAgentClientPicker,
    selectedClientId: input.selectedClientId,
    onSelectedClientIdChange: input.setSelectedClientId,
    isAllDay: input.isAllDay,
    onIsAllDayChange: input.onIsAllDayChange,
    startDate: input.startDate,
    endDate: input.endDate,
    onDateRangeChange: input.onDateRangeChange,
    startTime: input.startTime,
    endTime: input.endTime,
    onStartTimeChange: input.setStartTime,
    onEndTimeChange: input.setEndTime,
    eventLocation: input.eventLocation,
    onEventLocationChange: input.handleEventLocationChange,
    locationScriptsReady: input.locationScriptsReady,
    loadError: input.loadError,
    eventDescription: input.eventDescription,
    onEventDescriptionChange: (e: ChangeEvent<HTMLTextAreaElement>) =>
      input.setEventDescription(e.target.value),
    canSubmit: input.canSubmit,
    isSubmitting: input.formSubmitting,
    primaryActionLabel: input.primaryActionLabel,
    onSubmit: () => {
      void input.handleSubmit();
    },
    addGoogleMeet: input.addGoogleMeet,
    onAddGoogleMeetChange: input.setAddGoogleMeet,
    showGoogleMeetOption: input.showGoogleMeetOption,
    mutualSchedule: input.mutualSchedule,
    onCalendarTimedSlotPick: input.onCalendarTimedSlotPick,
    registerOutsideClickSafeTarget: input.registerOutsideClickSafeTarget,
  };
}
