import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EventRequestPayload } from "packages/features/messaging";
import { log, LOG_CATEGORIES } from "packages/logger";

// Mock dependencies
vi.mock("packages/logger", () => ({
  log: {
    error: vi.fn(),
  },
  LOG_CATEGORIES: {
    CALENDAR: "calendar",
  },
}));

describe("useMessagingEventHandlers - Event Request Logic", () => {
  let mockUpdateEventRequestStatus: ReturnType<typeof vi.fn>;
  let mockCreateEvent: ReturnType<typeof vi.fn>;
  let mockEnqueueToast: ReturnType<typeof vi.fn>;
  let mockRefreshActiveConversationHistory: ReturnType<typeof vi.fn>;
  let mockRefreshChats: ReturnType<typeof vi.fn>;
  let mockSetAcceptingEventRequestId: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateEventRequestStatus = vi.fn();
    mockCreateEvent = vi.fn();
    mockEnqueueToast = vi.fn();
    mockRefreshActiveConversationHistory = vi.fn();
    mockRefreshChats = vi.fn();
    mockSetAcceptingEventRequestId = vi.fn();
  });

  const createHandleAcceptEventRequest = (
    otherEmail: string | null,
    mode: "agent" | "client" = "client",
  ) => {
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
        const statusRes = await mockUpdateEventRequestStatus(
          messageId,
          "accepted",
        );
        if (!statusRes.success) {
          mockEnqueueToast({
            type: "error",
            message: statusRes.error ?? "Could not accept event request.",
          });
          return;
        }
        const timeZone =
          Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
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
        log.error(
          LOG_CATEGORIES.CALENDAR,
          "Error creating event from request",
          error,
        );
        mockEnqueueToast({
          type: "error",
          message: "Could not add event. Connect Google Calendar in Settings.",
        });
      } finally {
        mockSetAcceptingEventRequestId(null);
      }
    };
  };

  const createHandleCancelEventRequest = () => {
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
        log.error(
          LOG_CATEGORIES.CALENDAR,
          "Error cancelling event request",
          error,
        );
        mockEnqueueToast({
          type: "error",
          message: "Could not cancel event request. Please try again.",
        });
      }
    };
  };

  describe("handleAcceptEventRequest", () => {
    it("should accept event request and create calendar event with attendee", async () => {
      const messageId = "msg-123";
      const otherEmail = "agent@example.com";
      const payload: EventRequestPayload = {
        title: "Property Viewing",
        description: "Tour the new property",
        location: "123 Main St",
        start: "2026-04-15T10:00:00Z",
        end: "2026-04-15T11:00:00Z",
      };

      mockUpdateEventRequestStatus.mockResolvedValue({ success: true });
      mockCreateEvent.mockResolvedValue({ id: "event-123" });
      mockRefreshActiveConversationHistory.mockResolvedValue(undefined);
      mockRefreshChats.mockResolvedValue(undefined);

      const handleAccept = createHandleAcceptEventRequest(otherEmail, "client");
      await handleAccept(messageId, payload);

      expect(mockSetAcceptingEventRequestId).toHaveBeenCalledWith(messageId);
      expect(mockUpdateEventRequestStatus).toHaveBeenCalledWith(
        messageId,
        "accepted",
      );
      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: "Property Viewing",
          description: "Tour the new property",
          location: "123 Main St",
          attendees: [{ email: otherEmail }],
          calendarId: "primary",
        }),
      );
      expect(mockEnqueueToast).toHaveBeenCalledWith({
        type: "success",
        message: "Event added to your calendar and invite sent.",
      });
      expect(mockSetAcceptingEventRequestId).toHaveBeenCalledWith(null);
    });

    it("should include timezone in created event", async () => {
      const messageId = "msg-tz";
      const otherEmail = "client@example.com";
      const payload: EventRequestPayload = {
        title: "Meeting",
        start: "2026-04-15T14:00:00Z",
        end: "2026-04-15T15:00:00Z",
      };

      mockUpdateEventRequestStatus.mockResolvedValue({ success: true });
      mockCreateEvent.mockResolvedValue({ id: "event-tz" });

      const handleAccept = createHandleAcceptEventRequest(otherEmail, "agent");
      await handleAccept(messageId, payload);

      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          start: expect.objectContaining({
            dateTime: payload.start,
            timeZone: expect.any(String),
          }),
          end: expect.objectContaining({
            dateTime: payload.end,
            timeZone: expect.any(String),
          }),
        }),
      );
    });

    it("should refresh chat history for client mode", async () => {
      const messageId = "msg-client";
      const otherEmail = "agent@example.com";
      const payload: EventRequestPayload = {
        title: "Client Meeting",
        start: "2026-04-16T10:00:00Z",
        end: "2026-04-16T11:00:00Z",
      };

      mockUpdateEventRequestStatus.mockResolvedValue({ success: true });
      mockCreateEvent.mockResolvedValue({ id: "event-client" });
      mockRefreshActiveConversationHistory.mockResolvedValue(undefined);
      mockRefreshChats.mockResolvedValue(undefined);

      const handleAccept = createHandleAcceptEventRequest(otherEmail, "client");
      await handleAccept(messageId, payload);

      expect(mockRefreshActiveConversationHistory).toHaveBeenCalled();
      expect(mockRefreshChats).toHaveBeenCalled();
    });

    it("should not refresh chat history for agent mode", async () => {
      const messageId = "msg-agent";
      const otherEmail = "client@example.com";
      const payload: EventRequestPayload = {
        title: "Agent Meeting",
        start: "2026-04-16T14:00:00Z",
        end: "2026-04-16T15:00:00Z",
      };

      mockUpdateEventRequestStatus.mockResolvedValue({ success: true });
      mockCreateEvent.mockResolvedValue({ id: "event-agent" });

      const handleAccept = createHandleAcceptEventRequest(otherEmail, "agent");
      await handleAccept(messageId, payload);

      expect(mockRefreshActiveConversationHistory).not.toHaveBeenCalled();
      expect(mockRefreshChats).not.toHaveBeenCalled();
    });

    it("should handle missing other email", async () => {
      const messageId = "msg-no-email";
      const payload: EventRequestPayload = {
        title: "Test Event",
        start: "2026-04-15T10:00:00Z",
        end: "2026-04-15T11:00:00Z",
      };

      const handleAccept = createHandleAcceptEventRequest(null, "client");
      await handleAccept(messageId, payload);

      expect(mockEnqueueToast).toHaveBeenCalledWith({
        type: "error",
        message: "Could not add event. Other party email is missing.",
      });
      expect(mockUpdateEventRequestStatus).not.toHaveBeenCalled();
      expect(mockCreateEvent).not.toHaveBeenCalled();
    });

    it("should handle status update failure", async () => {
      const messageId = "msg-status-fail";
      const otherEmail = "test@example.com";
      const payload: EventRequestPayload = {
        title: "Test Event",
        start: "2026-04-15T10:00:00Z",
        end: "2026-04-15T11:00:00Z",
      };

      mockUpdateEventRequestStatus.mockResolvedValue({
        success: false,
        error: "Only the recipient can accept an event request",
      });

      const handleAccept = createHandleAcceptEventRequest(otherEmail, "client");
      await handleAccept(messageId, payload);

      expect(mockEnqueueToast).toHaveBeenCalledWith({
        type: "error",
        message: "Only the recipient can accept an event request",
      });
      expect(mockCreateEvent).not.toHaveBeenCalled();
      expect(mockSetAcceptingEventRequestId).toHaveBeenCalledWith(null);
    });

    it("should handle calendar event creation failure", async () => {
      const messageId = "msg-event-fail";
      const otherEmail = "test@example.com";
      const payload: EventRequestPayload = {
        title: "Test Event",
        start: "2026-04-15T10:00:00Z",
        end: "2026-04-15T11:00:00Z",
      };

      mockUpdateEventRequestStatus.mockResolvedValue({ success: true });
      mockCreateEvent.mockRejectedValue(new Error("Calendar not connected"));

      const handleAccept = createHandleAcceptEventRequest(otherEmail, "client");
      await handleAccept(messageId, payload);

      expect(log.error).toHaveBeenCalledWith(
        LOG_CATEGORIES.CALENDAR,
        "Error creating event from request",
        expect.any(Error),
      );
      expect(mockEnqueueToast).toHaveBeenCalledWith({
        type: "error",
        message: "Could not add event. Connect Google Calendar in Settings.",
      });
      expect(mockSetAcceptingEventRequestId).toHaveBeenCalledWith(null);
    });

    it("should trim location before creating event", async () => {
      const messageId = "msg-trim";
      const otherEmail = "test@example.com";
      const payload: EventRequestPayload = {
        title: "Meeting",
        location: "  123 Main St  ",
        start: "2026-04-15T10:00:00Z",
        end: "2026-04-15T11:00:00Z",
      };

      mockUpdateEventRequestStatus.mockResolvedValue({ success: true });
      mockCreateEvent.mockResolvedValue({ id: "event-trim" });

      const handleAccept = createHandleAcceptEventRequest(otherEmail, "client");
      await handleAccept(messageId, payload);

      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          location: "123 Main St",
        }),
      );
    });

    it("should omit empty location", async () => {
      const messageId = "msg-no-location";
      const otherEmail = "test@example.com";
      const payload: EventRequestPayload = {
        title: "Meeting",
        location: "   ",
        start: "2026-04-15T10:00:00Z",
        end: "2026-04-15T11:00:00Z",
      };

      mockUpdateEventRequestStatus.mockResolvedValue({ success: true });
      mockCreateEvent.mockResolvedValue({ id: "event-no-loc" });

      const handleAccept = createHandleAcceptEventRequest(otherEmail, "client");
      await handleAccept(messageId, payload);

      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          location: undefined,
        }),
      );
    });
  });

  describe("handleCancelEventRequest", () => {
    it("should cancel event request successfully", async () => {
      const messageId = "msg-cancel-123";

      mockUpdateEventRequestStatus.mockResolvedValue({ success: true });
      mockRefreshActiveConversationHistory.mockResolvedValue(undefined);
      mockRefreshChats.mockResolvedValue(undefined);

      const handleCancel = createHandleCancelEventRequest();
      await handleCancel(messageId);

      expect(mockUpdateEventRequestStatus).toHaveBeenCalledWith(
        messageId,
        "cancelled",
      );
      expect(mockRefreshActiveConversationHistory).toHaveBeenCalled();
      expect(mockRefreshChats).toHaveBeenCalled();
    });

    it("should handle cancellation failure", async () => {
      const messageId = "msg-cancel-fail";
      const errorMessage = "Event request is no longer pending";

      mockUpdateEventRequestStatus.mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      const handleCancel = createHandleCancelEventRequest();
      await handleCancel(messageId);

      expect(mockEnqueueToast).toHaveBeenCalledWith({
        type: "error",
        message: errorMessage,
      });
      expect(mockRefreshActiveConversationHistory).not.toHaveBeenCalled();
      expect(mockRefreshChats).not.toHaveBeenCalled();
    });

    it("should handle exception during cancellation", async () => {
      const messageId = "msg-cancel-error";

      mockUpdateEventRequestStatus.mockRejectedValue(
        new Error("Network error"),
      );

      const handleCancel = createHandleCancelEventRequest();
      await handleCancel(messageId);

      expect(log.error).toHaveBeenCalledWith(
        LOG_CATEGORIES.CALENDAR,
        "Error cancelling event request",
        expect.any(Error),
      );
      expect(mockEnqueueToast).toHaveBeenCalledWith({
        type: "error",
        message: "Could not cancel event request. Please try again.",
      });
    });
  });

  describe("Email resolution", () => {
    it("should use correct agent email for client accepting request", async () => {
      const messageId = "msg-agent-email";
      const agentEmail = "agent@realestate.com";
      const payload: EventRequestPayload = {
        title: "Property Tour",
        start: "2026-04-15T10:00:00Z",
        end: "2026-04-15T11:00:00Z",
      };

      mockUpdateEventRequestStatus.mockResolvedValue({ success: true });
      mockCreateEvent.mockResolvedValue({ id: "event-with-agent" });

      const handleAccept = createHandleAcceptEventRequest(agentEmail, "client");
      await handleAccept(messageId, payload);

      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          attendees: [{ email: agentEmail }],
        }),
      );
    });

    it("should use correct client email for agent accepting request", async () => {
      const messageId = "msg-client-email";
      const clientEmail = "client@buyer.com";
      const payload: EventRequestPayload = {
        title: "Property Showing",
        start: "2026-04-16T14:00:00Z",
        end: "2026-04-16T15:00:00Z",
      };

      mockUpdateEventRequestStatus.mockResolvedValue({ success: true });
      mockCreateEvent.mockResolvedValue({ id: "event-with-client" });

      const handleAccept = createHandleAcceptEventRequest(clientEmail, "agent");
      await handleAccept(messageId, payload);

      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          attendees: [{ email: clientEmail }],
        }),
      );
    });
  });
});
