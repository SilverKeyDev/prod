import { describe, expect, it, vi } from "vitest";

import { ClientCalendarAccessError } from "@/features/calendar/utils/core/clientCalendarAccess";

import { fetchClientCalendarEvents } from "./useClientCalendarEventsQuery";

vi.mock("@/features/calendar/api", () => ({
  googleCalendarApi: {
    getClientEvents: vi.fn(),
  },
}));

describe("fetchClientCalendarEvents", () => {
  it("throws ClientCalendarAccessError when API returns client_permission_required", async () => {
    const { googleCalendarApi } = await import("@/features/calendar/api");
    vi.mocked(googleCalendarApi.getClientEvents).mockResolvedValue({
      success: false,
      error: "client_permission_required",
      message: "This client hasn't connected their Google Calendar account yet.",
      client_has_connection: false,
    } as never);

    await expect(
      fetchClientCalendarEvents("client-1", "2026-01-01T00:00:00Z", "2026-01-08T00:00:00Z")
    ).rejects.toBeInstanceOf(ClientCalendarAccessError);
  });

  it("returns events when API succeeds", async () => {
    const { googleCalendarApi } = await import("@/features/calendar/api");
    vi.mocked(googleCalendarApi.getClientEvents).mockResolvedValue({
      success: true,
      data: { items: [{ id: "evt-1" }] },
    } as never);

    const events = await fetchClientCalendarEvents(
      "client-1",
      "2026-01-01T00:00:00Z",
      "2026-01-08T00:00:00Z"
    );

    expect(events).toEqual([{ id: "evt-1" }]);
  });
});
