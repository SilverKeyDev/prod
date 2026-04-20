import { useCallback, useEffect, useMemo, useState } from "react";

import { useIsAgent } from "packages/hooks/store";
import type { UIState } from "packages/store";
import { useAuthStore, useGoogleMapsStore, useUIStore } from "packages/store";
import type { GoogleMapsWindow } from "packages/types/integrations/google-maps";
import { getWindow } from "packages/utils/platform";

import type { CreateEventModalFormProps } from "@/features/calendar/components/view/CreateEventModalForm";
import type { ViewingStop } from "@/features/calendar/components/viewings/ViewingStopList";
import { useGoogleEvents } from "@/features/calendar/hooks/data/google/useGoogleEvents";
import { useCreateEventModalEffects } from "@/features/calendar/hooks/ui/useCreateEventModalEffects";
import { buildCreateEventModalFormProps } from "@/features/calendar/utils/createEventModal/buildCreateEventModalFormProps";
import {
  explicitEventTypeForCalendarKind,
  getCalendarEventKind,
} from "@/features/calendar/utils/createEventModal/calendarEventKinds";
import { defaultCreateEventTimedRange } from "@/features/calendar/utils/createEventModal/createEventModalDefaults";
import { deriveCreateEventModalFormSubmitState } from "@/features/calendar/utils/createEventModal/createEventModalFormDerived";
import { runCreateEventModalSubmit } from "@/features/calendar/utils/createEventModal/createEventModalSubmit";

import type { UseCreateEventModalParams } from "./useCreateEventModal.types";
import { useCreateEventModalChecklists } from "./useCreateEventModalChecklists";
import { useCreateEventModalPrefillAndKindState } from "./useCreateEventModalPrefillAndKindState";

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
}: UseCreateEventModalParams) {
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  const authUserId = useAuthStore((s) => s.user?.id ?? null);
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
  const [viewingStops, setViewingStops] = useState<ViewingStop[]>([]);
  const [agentMultiStopViewing, setAgentMultiStopViewing] = useState(false);

  const initialDateMs = initialDate?.getTime();
  const showAgentClientPicker = mode === "create" && isAgent;

  const {
    checklistSubjectId,
    checklistProgressLoading,
    kindOptionSlice,
    searchChecklistQuery,
    offerChecklistQuery,
  } = useCreateEventModalChecklists({
    isOpen,
    mode,
    isAgent,
    authUserId,
    selectedClientId,
  });

  const { eventKindId, setEventKindId, handleEventKindIdChange } =
    useCreateEventModalPrefillAndKindState({
      isOpen,
      mode,
      selectedClientId,
      prefilledCreateSnapshot,
      prefilledCreateKey,
      checklistSubjectId,
      searchChecklistQuery,
      offerChecklistQuery,
      setEventTitle,
      setEventDescription,
      setEventLocation,
      setStartDate,
      setEndDate,
      setStartTime,
      setEndTime,
      setIsAllDay,
    });

  const kindDef = useMemo(() => getCalendarEventKind(eventKindId), [eventKindId]);

  const useViewingStopList = useMemo(() => {
    if (mode === "edit") {
      return (existingEvent?.itinerary?.stops?.length ?? 0) > 0;
    }
    if (!kindDef.usesViewingStops) {
      return false;
    }
    if (!showAgentClientPicker) {
      return true;
    }
    return agentMultiStopViewing;
  }, [
    mode,
    existingEvent?.itinerary?.stops,
    kindDef.usesViewingStops,
    showAgentClientPicker,
    agentMultiStopViewing,
  ]);

  const isPropertyViewing = useViewingStopList;

  useEffect(() => {
    if (!isOpen) {
      setAgentMultiStopViewing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isPropertyViewing) {
      setViewingStops([]);
    }
  }, [isPropertyViewing]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    void loadGoogleMaps();
  }, [isOpen, loadGoogleMaps]);

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
    setViewingStops,
    setEventKindId,
    setAgentMultiStopViewing,
  });

  const onDateRangeChange = useCallback(
    (lo: string, hi: string) => {
      setStartDate(lo);
      setEndDate(hi);

      if (mode === "edit") {
        return;
      }

      const rawStart = lo.trim();
      const rawEnd = hi.trim();
      const scheduleStart = rawStart || rawEnd;
      const scheduleEnd = rawEnd || rawStart || scheduleStart;
      if (!scheduleStart || !scheduleEnd) {
        return;
      }

      setIsAllDay(scheduleStart !== scheduleEnd);
    },
    [mode]
  );

  const onIsAllDayChange = useCallback((next: boolean) => {
    setIsAllDay(next);
    if (!next) {
      const { startTime: st, endTime: et } = defaultCreateEventTimedRange();
      setStartTime(st);
      setEndTime(et);
    }
  }, []);

  const explicitEventType = explicitEventTypeForCalendarKind(eventKindId);

  const handleSubmit = useCallback(async () => {
    await runCreateEventModalSubmit({
      mode,
      eventTitle,
      explicitEventType,
      eventDescription,
      eventLocation,
      startDate,
      endDate,
      startTime,
      endTime,
      isAllDay,
      selectedCalendarId,
      defaultCalendarId,
      selectedClientId,
      showAgentClientPicker,
      agentMultiStopViewing,
      isPropertyViewing,
      viewingStops,
      existingEvent,
      onAddWithoutSchedule,
      createEvent,
      updateEvent,
      onEventCreated,
      onClose,
      setIsSavingUnscheduled,
      enqueueToast,
    });
  }, [
    mode,
    eventTitle,
    explicitEventType,
    eventDescription,
    eventLocation,
    startDate,
    endDate,
    startTime,
    endTime,
    isAllDay,
    selectedCalendarId,
    defaultCalendarId,
    selectedClientId,
    showAgentClientPicker,
    agentMultiStopViewing,
    isPropertyViewing,
    viewingStops,
    existingEvent,
    onAddWithoutSchedule,
    createEvent,
    updateEvent,
    onEventCreated,
    onClose,
    enqueueToast,
  ]);

  const { canSubmit, formSubmitting, primaryActionLabel } = deriveCreateEventModalFormSubmitState({
    mode,
    eventTitle,
    startDate,
    endDate,
    startTime,
    endTime,
    isAllDay,
    defaultCalendarId,
    onAddWithoutSchedule,
    isSubmitting,
    isSavingUnscheduled,
    isCreatingEvent,
    isUpdatingEvent,
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
  });

  return { formProps };
}
