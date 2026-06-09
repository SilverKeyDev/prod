import { useCallback, useEffect, useMemo, useState } from "react";

import { useIsAgent } from "packages/hooks/store";
import type { UIState } from "packages/store";
import { useGoogleMapsStore, useUIStore } from "packages/store";
import type { GoogleMapsWindow } from "packages/types/integrations/google-maps";
import { isVirtualMeetingEnabled } from "packages/utils/comms/calendar/parsing/eventMeetLink";
import { getWindow } from "packages/utils/core/platform";

import type { CreateEventModalFormProps } from "@/features/calendar/components/view/eventModal/CreateEventModalForm";
import { useCreateEventMutualAvailability } from "@/features/calendar/hooks/data/createEvent/useCreateEventMutualAvailability";
import { useGoogleEvents } from "@/features/calendar/hooks/data/google/useGoogleEvents";
import { useCreateEventModalEffects } from "@/features/calendar/hooks/ui/useCreateEventModalEffects";
import { buildCreateEventModalFormProps } from "@/features/calendar/utils/createEventModal/buildCreateEventModalFormProps";
import { CALENDAR_EVENT_KIND_ORDER } from "@/features/calendar/utils/createEventModal/calendarEventKinds";
import { deriveCreateEventModalFormSubmitState } from "@/features/calendar/utils/createEventModal/createEventModalFormDerived";
import { defaultGoogleMeetForCreate } from "@/features/calendar/utils/createEventModal/defaultGoogleMeetForCreate";
import { showGoogleMeetToggleForCreate } from "@/features/calendar/utils/createEventModal/googleMeetCreateEligibility";

import type { UseCreateEventModalParams } from "./useCreateEventModal.types";
import { useCreateEventModalDateHandlers } from "./useCreateEventModalDateHandlers";
import { useCreateEventModalPrefillAndKindState } from "./useCreateEventModalPrefillAndKindState";
import { useCreateEventModalSubmitFlow } from "./useCreateEventModalSubmitFlow";

export type { UseCreateEventModalParams } from "./useCreateEventModal.types";

export function useCreateEventModal({
  isOpen,
  onClose,
  initialDate,
  calendars,
  defaultCalendarId,
  onEventCreated,
  onAddWithoutSchedule,
  mode = "create",
  existingEvent,
  updateEvent: updateEventProp,
  prefilledCreateSnapshot = null,
  prefilledCreateKey,
  calendarEventRequest,
  registerOutsideClickSafeTarget,
}: UseCreateEventModalParams) {
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  const isAgent = useIsAgent();
  const {
    createEvent,
    updateEvent: updateEventFromHook,
    isCreatingEvent,
    isUpdatingEvent,
  } = useGoogleEvents();
  const updateEvent = updateEventProp ?? updateEventFromHook;
  const isSubmitting = isCreatingEvent || isUpdatingEvent;
  const {
    isLoaded: googleMapsLoaded,
    error: googleMapsError,
    loadGoogleMaps,
  } = useGoogleMapsStore();

  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [isAllDay, setIsAllDay] = useState(false);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>("primary");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isSavingUnscheduled, setIsSavingUnscheduled] = useState(false);
  const [addGoogleMeet, setAddGoogleMeet] = useState(true);
  const [createTimesChosenViaWeekSlot, setCreateTimesChosenViaWeekSlot] = useState(false);
  const [isSendingCalendarRequest, setIsSendingCalendarRequest] = useState(false);

  const initialDateMs = initialDate?.getTime();
  const showAgentClientPicker = mode === "create" && isAgent;
  const isCalendarEventRequestFlow = Boolean(calendarEventRequest && mode === "create");

  const { eventKindId, setEventKindId, handleEventKindIdChange } =
    useCreateEventModalPrefillAndKindState({
      isOpen,
      mode,
      prefilledCreateSnapshot,
      prefilledCreateKey,
      setEventTitle,
      setEventDescription,
      setEventLocation,
      setStartDate,
      setEndDate,
      setStartTime,
      setEndTime,
      setIsAllDay,
      setCreateTimesChosenViaWeekSlot,
    });

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    void loadGoogleMaps();
  }, [isOpen, loadGoogleMaps]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (mode === "create") {
      setAddGoogleMeet(defaultGoogleMeetForCreate());
    } else if (mode === "edit" && existingEvent) {
      setAddGoogleMeet(isVirtualMeetingEnabled(existingEvent));
    }
  }, [isOpen, mode, existingEvent]);

  useEffect(() => {
    if (!isOpen) {
      setCreateTimesChosenViaWeekSlot(false);
      setIsSendingCalendarRequest(false);
    }
  }, [isOpen]);

  const locationScriptsReady = useMemo(() => {
    if (googleMapsError) {
      return false;
    }
    if (!googleMapsLoaded) {
      return false;
    }
    const win = getWindow() as unknown as GoogleMapsWindow | null;
    return Boolean(win?.google?.maps?.places);
  }, [googleMapsError, googleMapsLoaded]);

  useCreateEventModalEffects({
    isOpen,
    mode,
    existingEvent,
    initialDateMs,
    calendars,
    defaultCalendarId,
    googleMapsError,
    setEventTitle,
    setEventDescription,
    setEventLocation,
    setIsAllDay,
    setStartDate,
    setEndDate,
    setStartTime,
    setEndTime,
    setSelectedCalendarId,
    setSelectedClientId,
    setLoadError,
    setIsSavingUnscheduled,
    setEventKindId,
  });

  const { onDateRangeChange, onCalendarTimedSlotPick, onIsAllDayChange } =
    useCreateEventModalDateHandlers(
      mode,
      setStartDate,
      setEndDate,
      setIsAllDay,
      setStartTime,
      setEndTime,
      setCreateTimesChosenViaWeekSlot
    );

  const showGoogleMeetOption = useMemo(() => {
    if (isCalendarEventRequestFlow) {
      return false;
    }
    return showGoogleMeetToggleForCreate({
      mode,
      startDate,
      endDate,
      isAllDay,
    });
  }, [isCalendarEventRequestFlow, mode, startDate, endDate, isAllDay]);

  const mutualScheduleFull = useCreateEventMutualAvailability({
    isOpen,
    mode,
    isAgent,
    selectedClientId,
    selectedCalendarId,
  });
  const mutualScheduleForForm = mode === "create" ? mutualScheduleFull : null;

  const clampTimedEndToStartLocalDay = useMemo(
    () => mode === "create" && !isAllDay && createTimesChosenViaWeekSlot,
    [mode, isAllDay, createTimesChosenViaWeekSlot]
  );

  const { handleSubmit } = useCreateEventModalSubmitFlow({
    isCalendarEventRequestFlow,
    calendarEventRequest,
    eventTitle,
    eventDescription,
    eventLocation,
    startDate,
    endDate,
    startTime,
    endTime,
    isAllDay,
    isAgent,
    selectedClientId,
    mode,
    eventKindId,
    selectedCalendarId,
    defaultCalendarId,
    existingEvent,
    onAddWithoutSchedule,
    createEvent,
    updateEvent,
    onEventCreated,
    onClose,
    enqueueToast,
    addGoogleMeet,
    setIsSendingCalendarRequest,
    setIsSavingUnscheduled,
    clampTimedEndToStartLocalDay,
  });

  const { canSubmit, formSubmitting, primaryActionLabel } = deriveCreateEventModalFormSubmitState({
    mode,
    eventTitle,
    startDate,
    endDate,
    startTime,
    endTime,
    isAllDay,
    defaultCalendarId,
    onAddWithoutSchedule: isCalendarEventRequestFlow ? undefined : onAddWithoutSchedule,
    isSubmitting,
    isSavingUnscheduled,
    isCreatingEvent,
    isUpdatingEvent,
    calendarEventRequest:
      isCalendarEventRequestFlow && calendarEventRequest
        ? {
            enabled: true,
            isAgent,
            selectedClientId,
            hasClientRecipientConversation: calendarEventRequest.conversations.length > 0,
            isSendingRequest: isSendingCalendarRequest,
          }
        : undefined,
  });

  const handleEventLocationChange = useCallback((value: string) => {
    setEventLocation(value);
  }, []);

  const formProps: CreateEventModalFormProps = buildCreateEventModalFormProps({
    isOpen,
    onClose,
    mode,
    calendars,
    selectedCalendarId,
    setSelectedCalendarId,
    eventKindId,
    handleEventKindIdChange,
    allowedKindIds: CALENDAR_EVENT_KIND_ORDER,
    eventTitle,
    setEventTitle,
    showAgentClientPicker,
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
    onCalendarTimedSlotPick,
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
    addGoogleMeet,
    setAddGoogleMeet,
    showGoogleMeetOption,
    existingEvent,
    mutualSchedule: mutualScheduleForForm,
    registerOutsideClickSafeTarget,
  });

  return { formProps };
}
