import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useClientSettings } from "packages/hooks/data/user/useClientSettings";
import { useIsAgent } from "packages/hooks/store";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { UIState } from "packages/store";
import { useAuthStore, useGoogleMapsStore, useUIStore } from "packages/store";
import type { GoogleMapsWindow } from "packages/types/integrations/google-maps";
import { getWindow } from "packages/utils/platform";

import type { CreateEventModalFormProps } from "@/features/calendar/components/view/CreateEventModalForm";
import type { ViewingStop } from "@/features/calendar/components/viewings/ViewingStopList";
import { useCreateEventMutualAvailability } from "@/features/calendar/hooks/data/createEvent/useCreateEventMutualAvailability";
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
import { defaultGoogleMeetForCreate } from "@/features/calendar/utils/createEventModal/defaultGoogleMeetForCreate";
import { showGoogleMeetToggleForCreate } from "@/features/calendar/utils/createEventModal/googleMeetCreateEligibility";
import type {
  ViewingRouteEndMode,
  ViewingRouteEndpoint,
  ViewingTourAnchor,
  ViewingTourStartSelection,
} from "@/features/calendar/utils/viewing/viewingRoutePlan";
import {
  viewingEndpointHasRoutingInput,
  viewingTourStartToEndpoint,
} from "@/features/calendar/utils/viewing/viewingRoutePlan";
import { buildEventRequestPayloadFromCreateFormState } from "@/features/messaging/utils/buildEventRequestPayloadFromCreateFormState";
import { buildEventRequestMessage } from "@/features/messaging/utils/eventRequestPayload";

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
  calendarEventRequest,
}: UseCreateEventModalParams) {
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  const authUserId = useAuthStore((s) => s.user?.id ?? null);
  const isAgent = useIsAgent();
  const { clientSettings } = useClientSettings();
  const viewingTourAnchors: ViewingTourAnchor[] = useMemo(
    () => clientSettings?.viewing_tour?.anchors ?? [],
    [clientSettings?.viewing_tour?.anchors]
  );
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
  const [viewingStartSelection, setViewingStartSelection] = useState<ViewingTourStartSelection>({
    kind: "omit",
  });
  const [viewingEndMode, setViewingEndMode] = useState<ViewingRouteEndMode>("last_property");
  const [viewingEndFixed, setViewingEndFixed] = useState<ViewingRouteEndpoint | null>(null);
  const defaultStartAnchorAppliedRef = useRef(false);
  const [addGoogleMeet, setAddGoogleMeet] = useState(true);
  /** Create flow: true after user sets start/end via week view double-click; false after grid/week-header date-only picks. */
  const [createTimesChosenViaWeekSlot, setCreateTimesChosenViaWeekSlot] = useState(false);
  const [isSendingCalendarRequest, setIsSendingCalendarRequest] = useState(false);

  const initialDateMs = initialDate?.getTime();
  const showAgentClientPicker = mode === "create" && isAgent;
  const isCalendarEventRequestFlow = Boolean(calendarEventRequest && mode === "create");

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
    return kindDef.usesViewingStops;
  }, [mode, existingEvent?.itinerary?.stops, kindDef.usesViewingStops]);

  const isPropertyViewing = useViewingStopList;

  useEffect(() => {
    if (!isPropertyViewing) {
      setViewingStops([]);
      setViewingStartSelection({ kind: "omit" });
      setViewingEndMode("last_property");
      setViewingEndFixed(null);
      defaultStartAnchorAppliedRef.current = false;
    }
  }, [isPropertyViewing]);

  useEffect(() => {
    if (!isOpen) {
      defaultStartAnchorAppliedRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isPropertyViewing || mode !== "create") {
      return;
    }
    if (defaultStartAnchorAppliedRef.current) {
      return;
    }
    const vt = clientSettings?.viewing_tour;
    const defId = vt?.default_start_anchor_id;
    const anchors = vt?.anchors;
    if (!defId || !anchors?.length) {
      return;
    }
    const match = anchors.find((a) => a.id === defId);
    if (match) {
      setViewingStartSelection({ kind: "saved", anchorId: defId });
      defaultStartAnchorAppliedRef.current = true;
    }
  }, [isOpen, isPropertyViewing, mode, clientSettings?.viewing_tour]);

  useEffect(() => {
    if (viewingEndMode !== "return_to_start") {
      return;
    }
    const ep = viewingTourStartToEndpoint(viewingStartSelection, viewingTourAnchors);
    if (!viewingEndpointHasRoutingInput(ep)) {
      setViewingEndMode("last_property");
    }
  }, [viewingEndMode, viewingStartSelection, viewingTourAnchors]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    void loadGoogleMaps();
  }, [isOpen, loadGoogleMaps]);

  useEffect(() => {
    if (!isOpen || mode !== "create") {
      return;
    }
    setAddGoogleMeet(defaultGoogleMeetForCreate({ eventKindId, eventTitle }));
  }, [isOpen, mode, eventKindId, eventTitle]);

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
    setViewingStops,
    setEventKindId,
    viewingTourAnchors,
    setViewingStartSelection,
    setViewingEndMode,
    setViewingEndFixed,
  });

  const onDateRangeChange = useCallback(
    (lo: string, hi: string) => {
      setStartDate(lo);
      setEndDate(hi);

      if (mode === "edit") {
        return;
      }

      setCreateTimesChosenViaWeekSlot(false);

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

  const onCalendarTimedSlotPick = useCallback(
    (payload: { startTime: string; endTime: string }) => {
      setStartTime(payload.startTime);
      setEndTime(payload.endTime);
      if (mode === "create") {
        setCreateTimesChosenViaWeekSlot(true);
      }
    },
    [mode]
  );

  const onIsAllDayChange = useCallback((next: boolean) => {
    setIsAllDay(next);
    if (!next) {
      const { startTime: st, endTime: et } = defaultCreateEventTimedRange();
      setStartTime(st);
      setEndTime(et);
      setCreateTimesChosenViaWeekSlot(false);
    }
  }, []);

  const explicitEventType = explicitEventTypeForCalendarKind(eventKindId);

  const showGoogleMeetOption = useMemo(
    () =>
      isCalendarEventRequestFlow
        ? false
        : showGoogleMeetToggleForCreate({
            mode,
            startDate,
            endDate,
            isAllDay,
          }),
    [isCalendarEventRequestFlow, mode, startDate, endDate, isAllDay]
  );

  const mutualScheduleFull = useCreateEventMutualAvailability({
    isOpen,
    mode,
    isAgent,
    selectedClientId,
    selectedCalendarId,
  });
  const mutualScheduleForForm = mode === "create" ? mutualScheduleFull : null;

  const handleSubmit = useCallback(async () => {
    if (isCalendarEventRequestFlow && calendarEventRequest) {
      setIsSendingCalendarRequest(true);
      try {
        const built = buildEventRequestPayloadFromCreateFormState({
          eventTitle,
          eventDescription,
          eventLocation,
          startDate,
          endDate,
          startTime,
          endTime,
          isAllDay,
          isPropertyViewing,
          viewingStops,
          viewingStartSelection,
          viewingTourAnchors,
          viewingEndMode,
          viewingEndFixed,
        });
        if ("error" in built) {
          enqueueToast({ type: "error", message: built.error });
          return;
        }
        const message = buildEventRequestMessage(built.payload);
        const { conversations, sendMessageDirect, sendCalendarEventMessage, onSuccess } =
          calendarEventRequest;

        let conversationId: string | null = null;
        if (isAgent) {
          if (!selectedClientId) {
            return;
          }
          const conv = conversations.find((c) => c.client_id === selectedClientId);
          conversationId = conv?.id ?? "new";
        } else {
          const clientConv = conversations[0];
          if (!clientConv) {
            enqueueToast({
              type: "error",
              message: "No conversation found. Open messaging first.",
            });
            return;
          }
          conversationId = clientConv.id;
        }

        const clientIdToPass =
          isAgent && conversationId === "new" ? (selectedClientId ?? undefined) : undefined;

        if (sendCalendarEventMessage) {
          await sendCalendarEventMessage(message, {
            conversationId,
            clientIdForAgent: clientIdToPass,
          });
        } else {
          await sendMessageDirect(conversationId, message, clientIdToPass);
        }
        onSuccess?.();
        onClose();
      } catch (error) {
        log.error(LOG_CATEGORIES.CALENDAR, "Error sending calendar event request", error);
      } finally {
        setIsSendingCalendarRequest(false);
      }
      return;
    }

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
      isPropertyViewing,
      viewingStops,
      viewingStartSelection,
      viewingTourAnchors,
      viewingEndMode,
      viewingEndFixed,
      existingEvent,
      onAddWithoutSchedule,
      createEvent,
      updateEvent,
      onEventCreated,
      onClose,
      setIsSavingUnscheduled,
      enqueueToast,
      addGoogleMeet: showGoogleMeetOption ? addGoogleMeet : false,
    });
  }, [
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
    isPropertyViewing,
    viewingStops,
    viewingStartSelection,
    viewingTourAnchors,
    viewingEndMode,
    viewingEndFixed,
    isAgent,
    selectedClientId,
    mode,
    explicitEventType,
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
    showGoogleMeetOption,
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
    kindOptionSlice,
    checklistProgressLoading,
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
    createTimesChosenViaWeekSlot,
    onCalendarTimedSlotPick,
    isPropertyViewing,
    viewingStops,
    setViewingStops,
    viewingStartSelection,
    setViewingStartSelection,
    viewingEndMode,
    setViewingEndMode,
    viewingEndFixed,
    setViewingEndFixed,
    viewingTourAnchors,
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
    mutualSchedule: mutualScheduleForForm,
  });

  return { formProps };
}
