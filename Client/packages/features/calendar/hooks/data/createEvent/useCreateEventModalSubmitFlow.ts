import { useCallback } from "react";

import { log, LOG_CATEGORIES } from "packages/logger";
import type { UIState } from "packages/store";

import type { ViewingStop } from "@/features/calendar/components/viewings/ViewingStopList";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { CreateEventModalAddWithoutSchedulePayload } from "@/features/calendar/types/createEventModal";
import type { GoogleEvent } from "@/features/calendar/types/googleEvent";
import {
  type CalendarEventKindId,
  explicitEventTypeForCalendarKind,
} from "@/features/calendar/utils/createEventModal/calendarEventKinds";
import { runCreateEventModalSubmit } from "@/features/calendar/utils/createEventModal/createEventModalSubmit";
import type {
  ViewingRouteEndMode,
  ViewingRouteEndpoint,
  ViewingTourAnchor,
  ViewingTourStartSelection,
} from "@/features/calendar/utils/viewing/viewingRoutePlan";
import { buildEventRequestPayloadFromCreateFormState } from "@/features/messaging/utils/buildEventRequestPayloadFromCreateFormState";
import { buildEventRequestMessage } from "@/features/messaging/utils/eventRequestPayload";

import type { CalendarEventRequestModalIntegration } from "./useCreateEventModal.types";

type EnqueueToast = UIState["enqueueToast"];

export function useCreateEventModalSubmitFlow(params: {
  isCalendarEventRequestFlow: boolean;
  calendarEventRequest: CalendarEventRequestModalIntegration | undefined;
  eventTitle: string;
  eventDescription: string;
  eventLocation: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  isPropertyViewing: boolean;
  viewingStops: ViewingStop[];
  viewingStartSelection: ViewingTourStartSelection;
  viewingTourAnchors: ViewingTourAnchor[];
  viewingEndMode: ViewingRouteEndMode;
  viewingEndFixed: ViewingRouteEndpoint | null;
  isAgent: boolean;
  selectedClientId: string | null;
  mode: "create" | "edit";
  eventKindId: CalendarEventKindId;
  selectedCalendarId: string;
  defaultCalendarId: string | undefined | null;
  existingEvent: ExtendedGoogleEvent | undefined;
  onAddWithoutSchedule?: (payload: CreateEventModalAddWithoutSchedulePayload) => Promise<void>;
  createEvent: (event: GoogleEvent) => Promise<unknown>;
  updateEvent:
    | ((eventId: string, event: GoogleEvent, calendarId?: string) => Promise<unknown>)
    | undefined;
  onEventCreated?: () => void;
  onClose: () => void;
  enqueueToast: EnqueueToast;
  addGoogleMeet: boolean;
  showGoogleMeetOption: boolean;
  setIsSendingCalendarRequest: (v: boolean) => void;
  setIsSavingUnscheduled: (v: boolean) => void;
}) {
  const {
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
    showGoogleMeetOption,
    setIsSendingCalendarRequest,
    setIsSavingUnscheduled,
  } = params;

  const explicitEventType = explicitEventTypeForCalendarKind(eventKindId);

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
    setIsSendingCalendarRequest,
    setIsSavingUnscheduled,
  ]);

  return { handleSubmit };
}
