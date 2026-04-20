import type { ChangeEvent } from "react";

import type { CreateEventModalFormProps } from "@/features/calendar/components/view/CreateEventModalForm";
import type { ViewingStop } from "@/features/calendar/components/viewings/ViewingStopList";
import type { Calendar } from "@/features/calendar/types/calendar";

import type { CalendarEventKindOptionSlice } from "./calendarEventKindOptions";
import type { CalendarEventKindId } from "./calendarEventKinds";

export type BuildCreateEventModalFormPropsInput = {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  calendars: Calendar[];
  selectedCalendarId: string;
  setSelectedCalendarId: (id: string) => void;
  eventKindId: CalendarEventKindId;
  handleEventKindIdChange: (id: CalendarEventKindId) => void;
  kindOptionSlice: CalendarEventKindOptionSlice;
  checklistProgressLoading: boolean;
  eventTitle: string;
  setEventTitle: (v: string) => void;
  showAgentClientPicker: boolean;
  agentMultiStopViewing: boolean;
  setAgentMultiStopViewing: (v: boolean) => void;
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
  isPropertyViewing: boolean;
  viewingStops: ViewingStop[];
  setViewingStops: (v: ViewingStop[]) => void;
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
};

export function buildCreateEventModalFormProps(
  input: BuildCreateEventModalFormPropsInput
): CreateEventModalFormProps {
  const {
    isOpen,
    onClose,
    mode,
    calendars,
    selectedCalendarId,
    setSelectedCalendarId,
    eventKindId,
    handleEventKindIdChange,
    kindOptionSlice,
    checklistProgressLoading,
    eventTitle,
    setEventTitle,
    showAgentClientPicker,
    agentMultiStopViewing,
    setAgentMultiStopViewing,
    selectedClientId,
    setSelectedClientId,
    isAllDay,
    onIsAllDayChange,
    startDate,
    endDate,
    onDateRangeChange,
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    isPropertyViewing,
    viewingStops,
    setViewingStops,
    eventLocation,
    handleEventLocationChange,
    locationScriptsReady,
    loadError,
    eventDescription,
    setEventDescription,
    canSubmit,
    formSubmitting,
    primaryActionLabel,
    handleSubmit,
  } = input;

  return {
    isOpen,
    onClose,
    mode,
    calendars,
    selectedCalendarId,
    onCalendarChange: setSelectedCalendarId,
    hideCalendarPicker: mode === "create",
    eventKindId,
    onEventKindIdChange: handleEventKindIdChange,
    kindOptionSlice,
    checklistProgressLoading,
    eventTitle,
    onEventTitleChange: (e: ChangeEvent<HTMLInputElement>) => setEventTitle(e.target.value),
    showAgentClientPicker,
    showAgentMultiStopViewingToggle: showAgentClientPicker && eventKindId === "property_viewings",
    agentMultiStopViewing,
    onAgentMultiStopViewingChange: setAgentMultiStopViewing,
    selectedClientId,
    onSelectedClientIdChange: setSelectedClientId,
    isAllDay,
    onIsAllDayChange,
    startDate,
    endDate,
    onDateRangeChange,
    startTime,
    endTime,
    onStartTimeChange: setStartTime,
    onEndTimeChange: setEndTime,
    isPropertyViewing,
    viewingStops,
    onViewingStopsChange: setViewingStops,
    eventLocation,
    onEventLocationChange: handleEventLocationChange,
    locationScriptsReady,
    loadError,
    eventDescription,
    onEventDescriptionChange: (e: ChangeEvent<HTMLTextAreaElement>) =>
      setEventDescription(e.target.value),
    canSubmit,
    isSubmitting: formSubmitting,
    primaryActionLabel,
    onSubmit: () => {
      void handleSubmit();
    },
  };
}
