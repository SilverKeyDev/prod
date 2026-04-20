import { describe, expect, it } from "vitest";

import { deriveCreateEventModalFormSubmitState } from "./createEventModalFormDerived";

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
});
