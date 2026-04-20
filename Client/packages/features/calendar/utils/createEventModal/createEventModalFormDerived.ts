export type CreateEventModalFormDerivedSubmit = {
  hasSchedule: boolean;
  canSubmit: boolean;
  formSubmitting: boolean;
  primaryActionLabel: string;
};

export function deriveCreateEventModalFormSubmitState(input: {
  mode: "create" | "edit";
  eventTitle: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  defaultCalendarId?: string | null;
  onAddWithoutSchedule?: unknown;
  isSubmitting: boolean;
  isSavingUnscheduled: boolean;
  isCreatingEvent: boolean;
  isUpdatingEvent: boolean;
}): CreateEventModalFormDerivedSubmit {
  const rawStartForUi = input.startDate.trim();
  const rawEndForUi = input.endDate.trim();
  const scheduleStartForUi = rawStartForUi || rawEndForUi;
  const scheduleEndForUi = rawEndForUi || rawStartForUi || scheduleStartForUi;
  const hasSchedule = Boolean(scheduleStartForUi && scheduleEndForUi);
  const canSubmitUnscheduled = Boolean(input.eventTitle.trim() && input.onAddWithoutSchedule);
  const canSubmitScheduled = Boolean(
    input.eventTitle.trim() &&
    hasSchedule &&
    (input.isAllDay || (input.startTime && input.endTime)) &&
    (input.mode === "edit" || Boolean(input.defaultCalendarId))
  );

  const canSubmit =
    input.mode === "edit"
      ? canSubmitScheduled
      : hasSchedule
        ? canSubmitScheduled
        : canSubmitUnscheduled;

  const formSubmitting = input.isSubmitting || input.isSavingUnscheduled;
  const primaryActionLabel =
    input.mode === "edit"
      ? input.isUpdatingEvent
        ? "Updating..."
        : "Update Event"
      : hasSchedule
        ? input.isCreatingEvent
          ? "Adding..."
          : "Add"
        : input.isSavingUnscheduled
          ? "Adding..."
          : "Add";

  return { hasSchedule, canSubmit, formSubmitting, primaryActionLabel };
}
