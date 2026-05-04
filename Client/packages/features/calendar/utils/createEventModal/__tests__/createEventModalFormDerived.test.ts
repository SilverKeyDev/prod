import { describe, expect, it } from "vitest";

import { deriveCreateEventModalFormSubmitState } from "@/features/calendar/utils/createEventModal/createEventModalFormDerived";

describe("deriveCreateEventModalFormSubmitState", () => {
  it("create mode without schedule allows unscheduled submit when handler exists", () => {
    const r = deriveCreateEventModalFormSubmitState({
      mode: "create",
      eventTitle: "Todo",
      startDate: "",
      endDate: "",
      startTime: "09:00",
      endTime: "10:00",
      isAllDay: false,
      defaultCalendarId: "cal",
      onAddWithoutSchedule: async () => {},
      isSubmitting: false,
      isSavingUnscheduled: false,
      isCreatingEvent: false,
      isUpdatingEvent: false,
    });
    expect(r.canSubmit).toBe(true);
    expect(r.primaryActionLabel).toBe("Add");
  });

  it("edit mode requires schedule", () => {
    const r = deriveCreateEventModalFormSubmitState({
      mode: "edit",
      eventTitle: "Meet",
      startDate: "",
      endDate: "",
      startTime: "09:00",
      endTime: "10:00",
      isAllDay: false,
      defaultCalendarId: "cal",
      isSubmitting: false,
      isSavingUnscheduled: false,
      isCreatingEvent: false,
      isUpdatingEvent: false,
    });
    expect(r.canSubmit).toBe(false);
  });

  it("messaging calendar request requires schedule and recipient", () => {
    const base = {
      mode: "create" as const,
      eventTitle: "Showing",
      startDate: "2026-05-01",
      endDate: "2026-05-01",
      startTime: "09:00",
      endTime: "10:00",
      isAllDay: false,
      defaultCalendarId: "cal",
      isSubmitting: false,
      isSavingUnscheduled: false,
      isCreatingEvent: false,
      isUpdatingEvent: false,
      calendarEventRequest: {
        enabled: true,
        isAgent: true,
        selectedClientId: null as string | null,
        hasClientRecipientConversation: true,
        isSendingRequest: false,
      },
    };
    expect(deriveCreateEventModalFormSubmitState(base).canSubmit).toBe(false);
    expect(
      deriveCreateEventModalFormSubmitState({
        ...base,
        calendarEventRequest: {
          ...base.calendarEventRequest,
          selectedClientId: "c1",
        },
      }).canSubmit
    ).toBe(true);
    expect(
      deriveCreateEventModalFormSubmitState({
        ...base,
        calendarEventRequest: {
          ...base.calendarEventRequest,
          isAgent: false,
          selectedClientId: null,
          hasClientRecipientConversation: false,
        },
      }).canSubmit
    ).toBe(false);
  });
});
