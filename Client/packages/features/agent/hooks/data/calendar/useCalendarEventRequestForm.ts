import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useQueries } from "@tanstack/react-query";

import { type ViewingItinerary, type ViewingStop } from "packages/api/viewings";
import {
  CALENDAR_EVENT_KINDS,
  type CalendarEventKindId,
  getCalendarEventKindOptionSlice,
} from "packages/features/calendar";
import { getTaskChecklistForSubject } from "packages/features/checklists/api/checklists";
// Import path avoids messaging barrel cycle (messaging barrel → AgentMessaging → MessagingModals → agent).
import { useAgentChats } from "packages/features/messaging/hooks/data/useAgentChats";
import { useEventRequestScheduleAvailability } from "packages/hooks/data/calendar/useEventRequestScheduleAvailability";
import { useClientSettings } from "packages/hooks/data/user/useClientSettings";
import { useIsAgent } from "packages/hooks/store";
import { log } from "packages/logger";
import { type UIState, useAuthStore, useUIStore } from "packages/store";
import { dateNow, dateParseISO } from "packages/utils/date";

import { useAgentClients } from "@/features/agent/hooks/data/clients/useAgentClients";
import {
  buildViewingItineraryDraftFromForm,
  primaryLocationLabelFromItinerary,
  viewingEndpointHasRoutingInput,
  type ViewingRouteEndMode,
  type ViewingRouteEndpoint,
  viewingStopsHaveAtLeastOneAddress,
  type ViewingTourAnchor,
  type ViewingTourStartSelection,
  viewingTourStartToEndpoint,
} from "@/features/calendar/utils/viewing/viewingRoutePlan";
import type { MessagingSendMessageOptions } from "@/features/messaging/hooks/data/messaging/types";
import {
  buildEventRequestMessage,
  type EventRequestPayload,
} from "@/features/messaging/utils/eventRequestPayload";

export type UseCalendarEventRequestFormParams = {
  onClose: () => void;
  onSuccess?: () => void;
  sendCalendarEventMessage?: (
    message: string,
    options: MessagingSendMessageOptions & { conversationId: string }
  ) => Promise<void>;
};

export function useCalendarEventRequestForm({
  onClose,
  onSuccess,
  sendCalendarEventMessage,
}: UseCalendarEventRequestFormParams) {
  const isAgent = useIsAgent();
  const authUserId = useAuthStore((s) => s.user?.id ?? null);
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  const { clients, isLoading: isLoadingClients } = useAgentClients();
  const { clientSettings } = useClientSettings();
  const viewingTourAnchors: ViewingTourAnchor[] = useMemo(
    () => clientSettings?.viewing_tour?.anchors ?? [],
    [clientSettings?.viewing_tour?.anchors]
  );
  const { conversations, sendMessage: sendMessageDirect } = useAgentChats();

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [eventKindId, setEventKindId] = useState<CalendarEventKindId>("other");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [viewingStops, setViewingStops] = useState<ViewingStop[]>([]);
  const [viewingStartSelection, setViewingStartSelection] = useState<ViewingTourStartSelection>({
    kind: "omit",
  });
  const [viewingEndMode, setViewingEndMode] = useState<ViewingRouteEndMode>("last_property");
  const [viewingEndFixed, setViewingEndFixed] = useState<ViewingRouteEndpoint | null>(null);

  const checklistSubjectId = useMemo(() => {
    if (!isAgent) {
      return authUserId;
    }
    return selectedClientId;
  }, [isAgent, authUserId, selectedClientId]);

  const [searchChecklistQuery, offerChecklistQuery] = useQueries({
    queries: [
      {
        queryKey: ["transactionTasks", checklistSubjectId, "search"] as const,
        queryFn: () => getTaskChecklistForSubject(checklistSubjectId as string, "search"),
        enabled: Boolean(checklistSubjectId),
      },
      {
        queryKey: ["transactionTasks", checklistSubjectId, "offer"] as const,
        queryFn: () => getTaskChecklistForSubject(checklistSubjectId as string, "offer"),
        enabled: Boolean(checklistSubjectId),
      },
    ],
  });

  const checklistProgressLoading =
    Boolean(checklistSubjectId) &&
    (searchChecklistQuery.isLoading || offerChecklistQuery.isLoading);

  const kindOptionSlice = useMemo(
    () =>
      getCalendarEventKindOptionSlice({
        searchCheckedIds: checklistSubjectId ? searchChecklistQuery.data?.checkedIds : undefined,
        offerCheckedIds: checklistSubjectId ? offerChecklistQuery.data?.checkedIds : undefined,
      }),
    [
      checklistSubjectId,
      searchChecklistQuery.data?.checkedIds,
      offerChecklistQuery.data?.checkedIds,
    ]
  );

  const kindSeededRef = useRef(false);

  useEffect(() => {
    kindSeededRef.current = false;
  }, [checklistSubjectId]);

  useEffect(() => {
    if (kindSeededRef.current) {
      return;
    }
    if (checklistSubjectId) {
      if (searchChecklistQuery.isLoading || offerChecklistQuery.isLoading) {
        return;
      }
    }
    const slice = getCalendarEventKindOptionSlice({
      searchCheckedIds: checklistSubjectId ? searchChecklistQuery.data?.checkedIds : undefined,
      offerCheckedIds: checklistSubjectId ? offerChecklistQuery.data?.checkedIds : undefined,
    });
    setEventKindId(slice.defaultKindId);
    if (slice.defaultKindId !== "other") {
      setEventTitle(CALENDAR_EVENT_KINDS[slice.defaultKindId].label);
    } else {
      setEventTitle("");
    }
    kindSeededRef.current = true;
  }, [
    checklistSubjectId,
    searchChecklistQuery.isLoading,
    searchChecklistQuery.data?.checkedIds,
    offerChecklistQuery.isLoading,
    offerChecklistQuery.data?.checkedIds,
  ]);

  const handleEventKindIdChange = useCallback((id: CalendarEventKindId) => {
    setEventKindId(id);
    if (id !== "other") {
      setEventTitle(CALENDAR_EVENT_KINDS[id].label);
    } else {
      setEventTitle("");
    }
  }, []);

  const kindDef = useMemo(() => CALENDAR_EVENT_KINDS[eventKindId], [eventKindId]);

  const isPropertyViewing = kindDef.usesViewingStops;

  useEffect(() => {
    if (!isPropertyViewing) {
      setViewingStops([]);
      setViewingStartSelection({ kind: "omit" });
      setViewingEndMode("last_property");
      setViewingEndFixed(null);
    }
  }, [isPropertyViewing]);

  useEffect(() => {
    if (viewingEndMode !== "return_to_start") {
      return;
    }
    const ep = viewingTourStartToEndpoint(viewingStartSelection, viewingTourAnchors);
    if (!viewingEndpointHasRoutingInput(ep)) {
      setViewingEndMode("last_property");
    }
  }, [viewingEndMode, viewingStartSelection, viewingTourAnchors]);

  const getConversationId = useCallback(
    (clientId: string): string | null => {
      const conversation = conversations.find((c) => c.client_id === clientId);
      return conversation?.id ?? null;
    },
    [conversations]
  );

  const clientConversation = !isAgent && conversations.length > 0 ? conversations[0] : null;

  const minDate = dateNow().add(1, "day").format("YYYY-MM-DD");

  const { dateOptions: eventRequestDateOptions, buildTimeOptionsForDate } =
    useEventRequestScheduleAvailability({
      minDateYmd: minDate,
    });

  const eventRequestTimeOptions = useMemo(
    () => buildTimeOptionsForDate(eventDate),
    [buildTimeOptionsForDate, eventDate]
  );

  useEffect(() => {
    if (!eventTime) {
      return;
    }
    const opt = eventRequestTimeOptions.find((o) => o.value === eventTime);
    if (opt?.disabled) {
      setEventTime("");
    }
  }, [eventDate, eventTime, eventRequestTimeOptions]);

  const canSend = Boolean(
    eventTitle.trim() &&
    eventDate &&
    eventTime &&
    (isAgent ? selectedClientId !== null : clientConversation !== null) &&
    (!isPropertyViewing || viewingStopsHaveAtLeastOneAddress(viewingStops))
  );

  const resetForm = useCallback(() => {
    setEventKindId("other");
    setEventTitle("");
    setEventDescription("");
    setEventLocation("");
    setEventDate("");
    setEventTime("");
    setSelectedClientId(null);
    setViewingStops([]);
    setViewingStartSelection({ kind: "omit" });
    setViewingEndMode("last_property");
    setViewingEndFixed(null);
    kindSeededRef.current = false;
  }, []);

  const handleSend = useCallback(async () => {
    if (!eventTitle.trim() || !eventDate || !eventTime) {
      return;
    }
    if (isPropertyViewing && !viewingStopsHaveAtLeastOneAddress(viewingStops)) {
      enqueueToast({
        type: "error",
        message: "Add at least one property address for the viewing tour.",
      });
      return;
    }
    let conversationId: string | null = null;
    if (isAgent) {
      if (!selectedClientId) {
        return;
      }
      conversationId = getConversationId(selectedClientId);
      if (!conversationId) {
        conversationId = "new";
      }
    } else {
      if (!clientConversation) {
        return;
      }
      conversationId = clientConversation.id;
    }
    if (!conversationId) {
      return;
    }
    const dateTime = dateParseISO(`${eventDate}T${eventTime}`);
    const endTime = dateTime.add(30, "minute");
    const payload: EventRequestPayload = {
      title: eventTitle.trim(),
      start: dateTime.toISOString(),
      end: endTime.toISOString(),
      description: eventDescription.trim() || undefined,
      location: eventLocation.trim() || undefined,
    };
    if (isPropertyViewing) {
      const it = buildViewingItineraryDraftFromForm({
        stops: viewingStops,
        startSelection: viewingStartSelection,
        anchors: viewingTourAnchors,
        endMode: viewingEndMode,
        endFixed: viewingEndFixed,
      });
      if (!it) {
        enqueueToast({
          type: "error",
          message: "Add at least one property address for the viewing tour.",
        });
        return;
      }
      payload.itinerary = it as ViewingItinerary;
      const loc = primaryLocationLabelFromItinerary(it);
      if (loc) {
        payload.location = loc;
      }
    }
    const message = buildEventRequestMessage(payload);
    setIsSending(true);
    try {
      const clientIdToPass = isAgent && conversationId === "new" ? selectedClientId : undefined;
      if (sendCalendarEventMessage) {
        await sendCalendarEventMessage(message, {
          conversationId,
          clientIdForAgent: clientIdToPass ?? undefined,
        });
      } else {
        await sendMessageDirect(conversationId, message, clientIdToPass ?? undefined);
      }
      resetForm();
      onSuccess?.();
      onClose();
    } catch (error) {
      log.error("CALENDAR", "Error sending event request", error);
    } finally {
      setIsSending(false);
    }
  }, [
    clientConversation,
    enqueueToast,
    eventDate,
    eventDescription,
    eventLocation,
    eventTime,
    eventTitle,
    getConversationId,
    isAgent,
    isPropertyViewing,
    viewingStops,
    viewingStartSelection,
    viewingTourAnchors,
    viewingEndMode,
    viewingEndFixed,
    onClose,
    onSuccess,
    resetForm,
    selectedClientId,
    sendCalendarEventMessage,
    sendMessageDirect,
  ]);

  return {
    isAgent,
    clients,
    isLoadingClients,
    clientConversation,
    selectedClientId,
    setSelectedClientId,
    eventKindId,
    onEventKindIdChange: handleEventKindIdChange,
    kindOptionSlice,
    checklistProgressLoading,
    eventTitle,
    setEventTitle,
    eventDescription,
    setEventDescription,
    eventLocation,
    setEventLocation,
    eventDate,
    setEventDate,
    eventTime,
    setEventTime,
    isSending,
    canSend,
    minDate,
    handleSend,
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
    eventRequestDateOptions,
    eventRequestTimeOptions,
  };
}
