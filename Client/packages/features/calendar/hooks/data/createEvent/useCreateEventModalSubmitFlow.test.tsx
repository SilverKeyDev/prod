import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AgentConversation } from "packages/api";

import type { CalendarEventRequestModalIntegration } from "./useCreateEventModal.types";
import { useCreateEventModalSubmitFlow } from "./useCreateEventModalSubmitFlow";

type SubmitFlowParams = Parameters<typeof useCreateEventModalSubmitFlow>[0];

function conversation(id: string, clientId: string): AgentConversation {
  return {
    id,
    agent_id: "agent-1",
    client_id: clientId,
    agent_name: "Pat Agent",
    agent_email: "pat@example.com",
    created_at: "2026-07-01T00:00:00.000Z",
    updated_at: "2026-07-01T00:00:00.000Z",
  };
}

function submitFlowParams(
  calendarEventRequest: CalendarEventRequestModalIntegration,
): SubmitFlowParams {
  return {
    isCalendarEventRequestFlow: true,
    calendarEventRequest,
    eventTitle: "Home inspection",
    eventDescription: "",
    eventLocation: "",
    startDate: "2026-08-10",
    endDate: "2026-08-10",
    startTime: "09:00",
    endTime: "10:00",
    isAllDay: false,
    isAgent: false,
    selectedClientId: null,
    mode: "create",
    eventKindId: "meeting",
    selectedCalendarId: "primary",
    defaultCalendarId: "primary",
    existingEvent: undefined,
    createEvent: vi.fn(),
    updateEvent: undefined,
    onClose: vi.fn(),
    enqueueToast: vi.fn(),
    addGoogleMeet: false,
    setIsSendingCalendarRequest: vi.fn(),
    setIsSavingUnscheduled: vi.fn(),
    clampTimedEndToStartLocalDay: false,
  };
}

describe("useCreateEventModalSubmitFlow", () => {
  it("sends a client request to the active conversation instead of the first conversation", async () => {
    const sendCalendarEventMessage = vi.fn(async () => undefined);
    const { result } = renderHook(() =>
      useCreateEventModalSubmitFlow(
        submitFlowParams({
          conversations: [
            conversation("conversation-1", "client-1"),
            conversation("conversation-2", "client-2"),
          ],
          activeConversationId: "conversation-2",
          sendMessageDirect: vi.fn(async () => undefined),
          sendCalendarEventMessage,
        }),
      ),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(sendCalendarEventMessage).toHaveBeenCalledWith(expect.any(String), {
      conversationId: "conversation-2",
      clientIdForAgent: undefined,
    });
    expect(sendCalendarEventMessage).toHaveBeenCalledTimes(1);
  });

  it("uses the active conversation id while the conversation list is still loading", async () => {
    const sendCalendarEventMessage = vi.fn(async () => undefined);
    const { result } = renderHook(() =>
      useCreateEventModalSubmitFlow(
        submitFlowParams({
          conversations: [],
          activeConversationId: "conversation-pending",
          sendMessageDirect: vi.fn(async () => undefined),
          sendCalendarEventMessage,
        }),
      ),
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(sendCalendarEventMessage).toHaveBeenCalledWith(expect.any(String), {
      conversationId: "conversation-pending",
      clientIdForAgent: undefined,
    });
    expect(sendCalendarEventMessage).toHaveBeenCalledTimes(1);
  });
});
