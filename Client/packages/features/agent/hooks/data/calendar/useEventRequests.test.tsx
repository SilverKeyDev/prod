import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { agentApi } from "@/features/agent/api/agent";

import { useEventRequests } from "./useEventRequests";

// Mock dependencies
vi.mock("@/features/agent/api/agent");
vi.mock("packages/logger", () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  LOG_CATEGORIES: {
    API: "api",
    CALENDAR: "calendar",
    ERRORS: "errors",
  },
}));

describe("useEventRequests", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient?.clear();
  });

  describe("Accept event request", () => {
    it("should successfully accept a pending event request", async () => {
      const messageId = "msg-123";

      vi.mocked(agentApi.updateEventRequestStatus).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useEventRequests(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isUpdating).toBe(false);

      const response = await result.current.updateEventRequestStatus(messageId, "accepted");

      expect(response.success).toBe(true);
      expect(agentApi.updateEventRequestStatus).toHaveBeenCalledWith(messageId, "accepted");
      expect(agentApi.updateEventRequestStatus).toHaveBeenCalledTimes(1);
    });

    it("should invalidate queries after successful acceptance", async () => {
      const messageId = "msg-456";
      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      vi.mocked(agentApi.updateEventRequestStatus).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useEventRequests(), {
        wrapper,
      });

      await result.current.updateEventRequestStatus(messageId, "accepted");

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalled();
      });
    });

    it("should handle API error when accepting event request", async () => {
      const messageId = "msg-error";
      const errorMessage = "Only the recipient can accept an event request";

      vi.mocked(agentApi.updateEventRequestStatus).mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      const { result } = renderHook(() => useEventRequests(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.updateEventRequestStatus(messageId, "accepted")).rejects.toThrow(
        errorMessage
      );
    });

    it("should handle sender trying to accept their own request", async () => {
      const messageId = "msg-self-accept";

      vi.mocked(agentApi.updateEventRequestStatus).mockResolvedValue({
        success: false,
        error: "Only the recipient can accept an event request",
      });

      const { result } = renderHook(() => useEventRequests(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.updateEventRequestStatus(messageId, "accepted")).rejects.toThrow(
        "Only the recipient can accept an event request"
      );
    });

    it("should handle already accepted event request", async () => {
      const messageId = "msg-already-accepted";

      vi.mocked(agentApi.updateEventRequestStatus).mockResolvedValue({
        success: false,
        error: "Event request is no longer pending",
      });

      const { result } = renderHook(() => useEventRequests(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.updateEventRequestStatus(messageId, "accepted")).rejects.toThrow(
        "Event request is no longer pending"
      );
    });
  });

  describe("Cancel event request", () => {
    it("should successfully cancel an event request (sender)", async () => {
      const messageId = "msg-cancel-sender";

      vi.mocked(agentApi.updateEventRequestStatus).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useEventRequests(), {
        wrapper: createWrapper(),
      });

      const response = await result.current.updateEventRequestStatus(messageId, "cancelled");

      expect(response.success).toBe(true);
      expect(agentApi.updateEventRequestStatus).toHaveBeenCalledWith(messageId, "cancelled");
    });

    it("should successfully cancel an event request (recipient)", async () => {
      const messageId = "msg-cancel-recipient";

      vi.mocked(agentApi.updateEventRequestStatus).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useEventRequests(), {
        wrapper: createWrapper(),
      });

      const response = await result.current.updateEventRequestStatus(messageId, "cancelled");

      expect(response.success).toBe(true);
      expect(agentApi.updateEventRequestStatus).toHaveBeenCalledWith(messageId, "cancelled");
    });

    it("should invalidate queries after successful cancellation", async () => {
      const messageId = "msg-789";
      const wrapper = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      vi.mocked(agentApi.updateEventRequestStatus).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useEventRequests(), {
        wrapper,
      });

      await result.current.updateEventRequestStatus(messageId, "cancelled");

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalled();
      });
    });
  });

  describe("Error handling", () => {
    it("should handle message not found error", async () => {
      const messageId = "msg-not-found";

      vi.mocked(agentApi.updateEventRequestStatus).mockResolvedValue({
        success: false,
        error: "Message not found",
      });

      const { result } = renderHook(() => useEventRequests(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.updateEventRequestStatus(messageId, "accepted")).rejects.toThrow(
        "Message not found"
      );
    });

    it("should handle user not in conversation error", async () => {
      const messageId = "msg-not-in-conv";

      vi.mocked(agentApi.updateEventRequestStatus).mockResolvedValue({
        success: false,
        error: "User is not part of this conversation",
      });

      const { result } = renderHook(() => useEventRequests(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.updateEventRequestStatus(messageId, "accepted")).rejects.toThrow(
        "User is not part of this conversation"
      );
    });

    it("should handle invalid message type error", async () => {
      const messageId = "msg-invalid-type";

      vi.mocked(agentApi.updateEventRequestStatus).mockResolvedValue({
        success: false,
        error: "Message is not an event request",
      });

      const { result } = renderHook(() => useEventRequests(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.updateEventRequestStatus(messageId, "accepted")).rejects.toThrow(
        "Message is not an event request"
      );
    });

    it("should handle generic API error", async () => {
      const messageId = "msg-generic-error";

      vi.mocked(agentApi.updateEventRequestStatus).mockResolvedValue({
        success: false,
        error: undefined,
      });

      const { result } = renderHook(() => useEventRequests(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.updateEventRequestStatus(messageId, "accepted")).rejects.toThrow(
        "Failed to update event request status"
      );
    });
  });

  describe("Loading states", () => {
    it("should track isUpdating state correctly", async () => {
      let resolveUpdate: (value: unknown) => void;
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve;
      });

      vi.mocked(agentApi.updateEventRequestStatus).mockReturnValue(updatePromise as Promise<never>);

      const { result } = renderHook(() => useEventRequests(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isUpdating).toBe(false);

      const updatePromiseCall = result.current.updateEventRequestStatus("msg-123", "accepted");

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(true);
      });

      resolveUpdate!({ success: true });

      await updatePromiseCall;

      await waitFor(() => {
        expect(result.current.isUpdating).toBe(false);
      });
    });
  });

  describe("Agent sends event request to client", () => {
    it("should send event request with correct message format", async () => {
      const messageId = "msg-agent-to-client";

      vi.mocked(agentApi.updateEventRequestStatus).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useEventRequests(), {
        wrapper: createWrapper(),
      });

      const response = await result.current.updateEventRequestStatus(messageId, "cancelled");

      expect(response.success).toBe(true);
    });
  });

  describe("Client sends event request to agent", () => {
    it("should send event request from client to agent", async () => {
      const messageId = "msg-client-to-agent";

      vi.mocked(agentApi.updateEventRequestStatus).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useEventRequests(), {
        wrapper: createWrapper(),
      });

      const response = await result.current.updateEventRequestStatus(messageId, "cancelled");

      expect(response.success).toBe(true);
    });

    it("should allow agent to accept client's event request", async () => {
      const messageId = "msg-client-req";

      vi.mocked(agentApi.updateEventRequestStatus).mockResolvedValue({
        success: true,
      });

      const { result } = renderHook(() => useEventRequests(), {
        wrapper: createWrapper(),
      });

      const response = await result.current.updateEventRequestStatus(messageId, "accepted");

      expect(response.success).toBe(true);
      expect(agentApi.updateEventRequestStatus).toHaveBeenCalledWith(messageId, "accepted");
    });
  });
});
