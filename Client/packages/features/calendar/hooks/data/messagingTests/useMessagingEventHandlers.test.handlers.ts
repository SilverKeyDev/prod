import type { Mock } from "vitest";

import type { EventRequestPayload } from "packages/features/messaging";
import { log, LOG_CATEGORIES } from "packages/logger";

export type AcceptMocks = {
  mockUpdateEventRequestStatus: Mock;
  mockCreateEvent: Mock;
  mockEnqueueToast: Mock;
  mockRefreshActiveConversationHistory: Mock;
  mockRefreshChats: Mock;
  mockSetAcceptingEventRequestId: Mock;
};

export function createHandleAcceptEventRequest(
  mocks: AcceptMocks,
  otherEmail: string | null,
  mode: "agent" | "client" = "client"
) {
  const {
    mockUpdateEventRequestStatus,
    mockCreateEvent,
    mockEnqueueToast,
    mockRefreshActiveConversationHistory,
    mockRefreshChats,
    mockSetAcceptingEventRequestId,
  } = mocks;

  return async (messageId: string, payload: EventRequestPayload) => {
    if (!otherEmail) {
      mockEnqueueToast({
        type: "error",
        message: "Could not add event. Other party email is missing.",
      });
      return;
    }
    mockSetAcceptingEventRequestId(messageId);
    try {
      const statusRes = await mockUpdateEventRequestStatus(messageId, "accepted");
      if (!statusRes.success) {
        mockEnqueueToast({
          type: "error",
          message: statusRes.error ?? "Could not accept event request.",
        });
        return;
      }
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
      const event = {
        summary: payload.title,
        description: payload.description ?? undefined,
        location: payload.location?.trim() || undefined,
        start: { dateTime: payload.start, timeZone },
        end: { dateTime: payload.end, timeZone },
        attendees: [{ email: otherEmail }],
        calendarId: "primary",
      };
      await mockCreateEvent(event);
      if (mode === "client") {
        await mockRefreshActiveConversationHistory();
        await mockRefreshChats();
      }
      mockEnqueueToast({
        type: "success",
        message: "Event added to your calendar and invite sent.",
      });
    } catch (error) {
      log.error(LOG_CATEGORIES.CALENDAR, "Error creating event from request", error);
      mockEnqueueToast({
        type: "error",
        message: "Could not add event. Connect Google Calendar in Settings.",
      });
    } finally {
      mockSetAcceptingEventRequestId(null);
    }
  };
}

export function createHandleCancelEventRequest(mocks: {
  mockUpdateEventRequestStatus: Mock;
  mockEnqueueToast: Mock;
  mockRefreshActiveConversationHistory: Mock;
  mockRefreshChats: Mock;
}) {
  const {
    mockUpdateEventRequestStatus,
    mockEnqueueToast,
    mockRefreshActiveConversationHistory,
    mockRefreshChats,
  } = mocks;

  return async (messageId: string) => {
    try {
      const res = await mockUpdateEventRequestStatus(messageId, "cancelled");
      if (res.success) {
        await mockRefreshActiveConversationHistory();
        await mockRefreshChats();
      } else {
        mockEnqueueToast({
          type: "error",
          message: res.error ?? "Could not cancel event request.",
        });
      }
    } catch (error) {
      log.error(LOG_CATEGORIES.CALENDAR, "Error cancelling event request", error);
      mockEnqueueToast({
        type: "error",
        message: "Could not cancel event request. Please try again.",
      });
    }
  };
}
