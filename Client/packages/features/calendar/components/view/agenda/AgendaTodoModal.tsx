import { useCallback, useEffect, useMemo, useState } from "react";

import { EventRequestTimeDropdown } from "packages/features/agent/components/modals/calendarEventRequest/EventRequestTimeDropdown";
import { defaultGoogleMeetForCreate } from "packages/features/calendar";
import { Button } from "packages/ui";
import { Box, Pressable, PrimitiveInput, Text } from "packages/ui/components/structure/primitives";
import ScrollView from "packages/ui/components/structure/primitives/scroll/ScrollView";
import BaseModal from "packages/ui/components/surfaces/modals/BaseModal";
import { parseAgendaDeadlineTime } from "packages/utils/comms/calendar/agenda/agentAgendaEvent";
import { CREATE_EVENT_TIME_STEP_MINUTES } from "packages/utils/comms/calendar/createEvent/eventFormGooglePayload";
import { buildTimeOptions } from "packages/utils/comms/scheduling/eventRequestScheduleOptions";
import { dayjs } from "packages/utils/core/date";

import {
  agendaFormValuesToSubmitPayload,
  type AgendaTodoFormSubmitPayload,
  type AgendaTodoFormValues,
  emptyAgendaTodoFormValues,
} from "@/features/calendar/utils/agenda/agendaTodoFormValues";

export type { AgendaTodoFormSubmitPayload };

type AgendaTodoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialValues?: AgendaTodoFormValues;
  onSubmit: (payload: AgendaTodoFormSubmitPayload) => Promise<void>;
  /** When true, show Meet toggle for dated create flows that create a Google Calendar event. */
  googleCalendarCreateEligible?: boolean;
  isSubmitting?: boolean;
};

export function AgendaTodoModal({
  isOpen,
  onClose,
  mode,
  initialValues,
  onSubmit,
  googleCalendarCreateEligible = false,
  isSubmitting = false,
}: AgendaTodoModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [time, setTime] = useState(() => emptyAgendaTodoFormValues().time);
  const [isAllDay, setIsAllDay] = useState(false);
  const [addGoogleMeet, setAddGoogleMeet] = useState(true);

  const timeOptions = useMemo(() => buildTimeOptions(CREATE_EVENT_TIME_STEP_MINUTES), []);

  const deadlineValid = useMemo(() => {
    const raw = deadlineDate.trim();
    if (raw === "") {
      return false;
    }
    return dayjs(raw, "YYYY-MM-DD", true).isValid();
  }, [deadlineDate]);

  const hasValidTimeForMeet = !isAllDay && deadlineValid && parseAgendaDeadlineTime(time) !== null;
  const showMeetToggle =
    mode === "create" && Boolean(googleCalendarCreateEligible) && hasValidTimeForMeet;
  const showScheduleOptions = deadlineValid;

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const next = initialValues ?? emptyAgendaTodoFormValues();
    setTitle(next.title);
    setDescription(next.description);
    setDeadlineDate(next.deadlineDate);
    setTime(next.time);
    setIsAllDay(next.isAllDay);
    setAddGoogleMeet(defaultGoogleMeetForCreate({ eventKindId: "other", eventTitle: next.title }));
  }, [isOpen, initialValues]);

  useEffect(() => {
    if (mode !== "create" || !isOpen) {
      return;
    }
    setAddGoogleMeet(defaultGoogleMeetForCreate({ eventKindId: "other", eventTitle: title }));
  }, [isOpen, mode, title]);

  const handleAllDayToggle = useCallback(() => {
    setIsAllDay((prev) => {
      const next = !prev;
      if (!next) {
        setTime(emptyAgendaTodoFormValues().time);
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    const payload = agendaFormValuesToSubmitPayload(
      { title, description, deadlineDate, time, isAllDay },
      { addGoogleMeet: showMeetToggle ? addGoogleMeet : false }
    );
    if (!payload) {
      return;
    }
    await onSubmit(payload);
  }, [addGoogleMeet, deadlineDate, description, isAllDay, onSubmit, showMeetToggle, time, title]);

  const modalTitle = mode === "edit" ? "Edit to-do" : "Add to agenda";
  const primaryLabel = mode === "edit" ? "Save" : "Add";
  const primaryIcon = mode === "edit" ? "check" : "plus";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      footerContent={
        <Box className="flex-row gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onPress={() => void handleSubmit()}
            iconName={primaryIcon}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {primaryLabel}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onPress={onClose}
            iconName="x"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </Box>
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text className="text-text-secondary mb-1 text-sm font-medium">Title</Text>
        <PrimitiveInput
          value={title}
          onValueChange={setTitle}
          placeholder="Task name"
          className="border-border bg-background-base text-text-primary mb-3 rounded-lg border px-3 py-2 text-base"
        />
        <Text className="text-text-secondary mb-1 text-sm font-medium">Description (optional)</Text>
        <PrimitiveInput
          value={description}
          onValueChange={setDescription}
          placeholder="Notes (optional)"
          multiline
          textAlignVertical="top"
          className="border-border bg-background-base text-text-primary mb-3 min-h-20 rounded-lg border px-3 py-2 text-base"
        />
        <Text className="text-text-secondary mb-1 text-sm font-medium">
          Date (optional, YYYY-MM-DD)
        </Text>
        <PrimitiveInput
          value={deadlineDate}
          onValueChange={setDeadlineDate}
          placeholder="YYYY-MM-DD (optional)"
          className="border-border bg-background-base text-text-primary mb-1 rounded-lg border px-3 py-2 text-base"
        />
        <Text className="text-text-secondary mb-2 text-sm">
          {mode === "edit"
            ? "Clear the date to remove the due date from this to-do."
            : "Add a date to save to your SilverKey calendar; leave empty for a to-do only."}
        </Text>
        {showScheduleOptions ? (
          <>
            <Pressable
              onPress={handleAllDayToggle}
              className="mb-3 flex-row items-center gap-2 active:opacity-80"
            >
              <Box
                className={`flex h-5 w-5 items-center justify-center rounded border ${
                  isAllDay ? "border-primary bg-primary" : "border-border"
                }`}
              >
                {isAllDay ? <Text className="text-xs font-bold text-white">✓</Text> : null}
              </Box>
              <Text className="text-text-primary text-sm">All day</Text>
            </Pressable>
            {!isAllDay ? (
              <Box className="mb-3">
                <EventRequestTimeDropdown value={time} onChange={setTime} options={timeOptions} />
              </Box>
            ) : null}
          </>
        ) : null}
        {showMeetToggle ? (
          <Pressable
            onPress={() => setAddGoogleMeet(!addGoogleMeet)}
            className="mb-4 flex-row items-center gap-2 active:opacity-80"
          >
            <Box
              className={`flex h-5 w-5 items-center justify-center rounded border ${
                addGoogleMeet ? "border-primary bg-primary" : "border-border"
              }`}
            >
              {addGoogleMeet ? <Text className="text-xs font-bold text-white">✓</Text> : null}
            </Box>
            <Text className="text-text-primary flex-1 text-sm">
              Add Google Meet video conferencing
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </BaseModal>
  );
}
