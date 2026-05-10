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
  /** Property viewings / multi-stop tour: require at least one property address. */
  isPropertyViewing?: boolean;
  hasViewingTourPropertyAddresses?: boolean;
  /** Messaging: calendar event request uses the same form as Add to Agenda with different submit rules. */
  calendarEventRequest?: {
    enabled: boolean;
    isAgent: boolean;
    selectedClientId: string | null;
    hasClientRecipientConversation: boolean;
    isSendingRequest: boolean;
  };
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

  const req = input.calendarEventRequest;
  const propertyViewingBlocked =
    Boolean(input.isPropertyViewing) && !input.hasViewingTourPropertyAddresses;

  const innerCanSubmit =
    req?.enabled && input.mode === "create"
      ? Boolean(
          input.eventTitle.trim() &&
          hasSchedule &&
          (input.isAllDay || (input.startTime && input.endTime)) &&
          (req.isAgent ? Boolean(req.selectedClientId) : req.hasClientRecipientConversation)
        )
      : input.mode === "edit"
        ? canSubmitScheduled
        : hasSchedule
          ? canSubmitScheduled
          : canSubmitUnscheduled;

  const canSubmit = innerCanSubmit && !propertyViewingBlocked;

  const formSubmitting =
    input.isSubmitting ||
    input.isSavingUnscheduled ||
    Boolean(req?.enabled && req.isSendingRequest);
  const primaryActionLabel =
    req?.enabled && input.mode === "create"
      ? req.isSendingRequest
        ? "Sending..."
        : "Send Request"
      : input.mode === "edit"
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
