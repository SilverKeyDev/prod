import { useCallback } from "react";

import { log } from "packages/logger";
import type { UIState } from "packages/store";
import {
  type CalendarEventKindId,
  explicitEventTypeForCalendarKind,
} from "packages/utils/comms/calendar/createEvent/calendarEventKinds";
import { buildEventRequestPayloadFromCreateFormState } from "packages/utils/comms/messaging/buildEventRequestPayloadFromCreateFormState";
import { buildEventRequestMessage } from "packages/utils/comms/messaging/eventRequestPayload";

import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { CreateEventModalAddWithoutSchedulePayload } from "@/features/calendar/types/createEventModal";
import type { GoogleEvent } from "@/features/calendar/types/googleEvent";
import { runCreateEventModalSubmit } from "@/features/calendar/utils/createEventModal/createEventModalSubmit";

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
  setIsSendingCalendarRequest: (v: boolean) => void;
  setIsSavingUnscheduled: (v: boolean) => void;
  clampTimedEndToStartLocalDay: boolean;
}) {
  const explicitEventType = explicitEventTypeForCalendarKind(params.eventKindId);

  const handleSubmit = useCallback(async () => {
    if (params.isCalendarEventRequestFlow && params.calendarEventRequest) {
      params.setIsSendingCalendarRequest(true);
      try {
        const built = buildEventRequestPayloadFromCreateFormState({
          eventTitle: params.eventTitle,
          eventDescription: params.eventDescription,
          eventLocation: params.eventLocation,
          startDate: params.startDate,
          endDate: params.endDate,
          startTime: params.startTime,
          endTime: params.endTime,
          isAllDay: params.isAllDay,
        });
        if ("error" in built) {
          params.enqueueToast({ type: "error", message: built.error });
          return;
        }
        const message = buildEventRequestMessage(built.payload);
        const { conversations, sendMessageDirect, sendCalendarEventMessage, onSuccess } =
          params.calendarEventRequest;

        let conversationId: string | null = null;
        if (params.isAgent) {
          if (!params.selectedClientId) {
            return;
          }
          const conv = conversations.find((c) => c.client_id === params.selectedClientId);
          conversationId = conv?.id ?? "new";
        } else {
          const activeId = params.calendarEventRequest.activeConversationId?.trim();
          const clientConv =
            (activeId ? conversations.find((c) => c.id === activeId) : undefined) ??
            conversations[0];
          if (!clientConv && !activeId) {
            params.enqueueToast({
              type: "error",
              message: "No conversation found. Open messaging first.",
            });
            return;
          }
          conversationId = clientConv?.id ?? activeId ?? null;
        }

        const clientIdToPass =
          params.isAgent && conversationId === "new"
            ? (params.selectedClientId ?? undefined)
            : undefined;

        if (sendCalendarEventMessage) {
          await sendCalendarEventMessage(message, {
            conversationId,
            clientIdForAgent: clientIdToPass,
          });
        } else {
          await sendMessageDirect(conversationId, message, clientIdToPass);
        }
        onSuccess?.();
        params.onClose();
      } catch (error) {
        log.error("CALENDAR", "Error sending calendar event request", error);
      } finally {
        params.setIsSendingCalendarRequest(false);
      }
      return;
    }

    await runCreateEventModalSubmit({
      mode: params.mode,
      eventTitle: params.eventTitle,
      explicitEventType,
      eventDescription: params.eventDescription,
      eventLocation: params.eventLocation,
      startDate: params.startDate,
      endDate: params.endDate,
      startTime: params.startTime,
      endTime: params.endTime,
      isAllDay: params.isAllDay,
      selectedCalendarId: params.selectedCalendarId,
      defaultCalendarId: params.defaultCalendarId,
      selectedClientId: params.selectedClientId,
      existingEvent: params.existingEvent,
      onAddWithoutSchedule: params.onAddWithoutSchedule,
      createEvent: params.createEvent,
      updateEvent: params.updateEvent,
      onEventCreated: params.onEventCreated,
      onClose: params.onClose,
      setIsSavingUnscheduled: params.setIsSavingUnscheduled,
      enqueueToast: params.enqueueToast,
      addGoogleMeet: params.addGoogleMeet,
      clampTimedEndToStartLocalDay: params.clampTimedEndToStartLocalDay || undefined,
    });
  }, [explicitEventType, params]);

  return { handleSubmit };
}
