import React, { useCallback, useEffect, useMemo, useState } from "react";

import { EventRequestTimeDropdown } from "packages/features/agent/components/modals/calendarEventRequest/EventRequestTimeDropdown.native";
import { defaultGoogleMeetForCreate } from "packages/features/calendar";
import { defaultCreateEventTimedRange } from "packages/features/calendar/utils/createEventModal/createEventModalDefaults";
import { log } from "packages/logger";
import { Button } from "packages/ui";
import { Box, Pressable, PrimitiveInput, Text } from "packages/ui/components/structure/primitives";
import ScrollView from "packages/ui/components/structure/primitives/scroll/ScrollView";
import BaseModal from "packages/ui/components/surfaces/modals/BaseModal";
import { parseAgendaDeadlineTime } from "packages/utils/comms/calendar/agenda/agentAgendaEvent";
import { CREATE_EVENT_TIME_STEP_MINUTES } from "packages/utils/comms/calendar/createEvent/eventFormGooglePayload";
import { buildTimeOptions } from "packages/utils/comms/scheduling/eventRequestScheduleOptions";
import { dayjs } from "packages/utils/core/date";

export type MobileAgendaAddButtonProps = {
  onSubmitTodo: (payload: {
    title: string;
    description: string | null;
    deadlineDate: string | null;
    deadlineTime: string | null;
    addGoogleMeet?: boolean;
  }) => Promise<void>;
  /** When true, show Meet toggle for dated flows that create a Google Calendar event. */
  googleCalendarCreateEligible?: boolean;
};

export function MobileAgendaAddButton({
  onSubmitTodo,
  googleCalendarCreateEligible = false,
}: MobileAgendaAddButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [deadlineInput, setDeadlineInput] = useState("");
  const [timeInput, setTimeInput] = useState(() => defaultCreateEventTimedRange().startTime);
  const [isAllDay, setIsAllDay] = useState(false);
  const [addGoogleMeet, setAddGoogleMeet] = useState(true);

  const timeOptions = useMemo(() => buildTimeOptions(CREATE_EVENT_TIME_STEP_MINUTES), []);

  const deadlineValid = useMemo(() => {
    const raw = deadlineInput.trim();
    if (raw === "") {
      return false;
    }
    return dayjs(raw, "YYYY-MM-DD", true).isValid();
  }, [deadlineInput]);

  const hasValidTimeForMeet =
    !isAllDay && deadlineValid && parseAgendaDeadlineTime(timeInput) !== null;
  const showMeetToggle = Boolean(googleCalendarCreateEligible) && hasValidTimeForMeet;
  const showScheduleOptions = deadlineValid;

  useEffect(() => {
    setAddGoogleMeet(
      defaultGoogleMeetForCreate({ eventKindId: "other", eventTitle: newTodoTitle })
    );
  }, [newTodoTitle]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setNewTodoTitle("");
    setDescriptionInput("");
    setDeadlineInput("");
    setTimeInput(defaultCreateEventTimedRange().startTime);
    setIsAllDay(false);
    setAddGoogleMeet(true);
  }, []);

  const handleAllDayToggle = useCallback(() => {
    setIsAllDay((prev) => {
      const next = !prev;
      if (!next) {
        setTimeInput(defaultCreateEventTimedRange().startTime);
      }
      return next;
    });
  }, []);

  const submitTodo = useCallback(async () => {
    const trimmed = newTodoTitle.trim();
    if (!trimmed) {
      return;
    }
    const rawDeadline = deadlineInput.trim();
    let deadlineDate: string | null = null;
    if (rawDeadline !== "") {
      const deadlineParsed = dayjs(rawDeadline, "YYYY-MM-DD", true);
      if (!deadlineParsed.isValid()) {
        return;
      }
      deadlineDate = deadlineParsed.format("YYYY-MM-DD");
    }
    const deadlineTime =
      isAllDay || !deadlineDate ? null : parseAgendaDeadlineTime(timeInput.trim());
    const descTrimmed = descriptionInput.trim();
    try {
      await onSubmitTodo({
        title: trimmed,
        description: descTrimmed === "" ? null : descTrimmed,
        deadlineDate,
        deadlineTime,
        addGoogleMeet: showMeetToggle ? addGoogleMeet : false,
      });
      closeModal();
    } catch (error) {
      log.error("DASHBOARD", "Failed to add agenda item (mobile)", error);
    }
  }, [
    addGoogleMeet,
    closeModal,
    deadlineInput,
    descriptionInput,
    newTodoTitle,
    onSubmitTodo,
    showMeetToggle,
    isAllDay,
    timeInput,
  ]);

  return (
    <>
      <Pressable
        onPress={() => setModalOpen(true)}
        className="border-border flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-dashed px-3 py-2 active:opacity-80"
      >
        <Text className="text-primary text-center text-sm font-medium">Add</Text>
      </Pressable>

      <BaseModal
        isOpen={modalOpen}
        onClose={closeModal}
        title="Add to agenda"
        footerContent={
          <Box className="flex-row gap-2">
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onPress={() => void submitTodo()}
              iconName="plus"
            >
              Add
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onPress={closeModal}
              iconName="x"
            >
              Cancel
            </Button>
          </Box>
        }
      >
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text className="text-text-secondary mb-1 text-sm font-medium">Title</Text>
          <PrimitiveInput
            value={newTodoTitle}
            onValueChange={setNewTodoTitle}
            placeholder="Task name"
            className="border-border bg-background-base text-text-primary mb-3 rounded-lg border px-3 py-2 text-base"
          />
          <Text className="text-text-secondary mb-1 text-sm font-medium">
            Description (optional)
          </Text>
          <PrimitiveInput
            value={descriptionInput}
            onValueChange={setDescriptionInput}
            placeholder="Notes (optional)"
            multiline
            textAlignVertical="top"
            className="border-border bg-background-base text-text-primary mb-3 min-h-20 rounded-lg border px-3 py-2 text-base"
          />
          <Text className="text-text-secondary mb-1 text-sm font-medium">
            Date (optional, YYYY-MM-DD)
          </Text>
          <PrimitiveInput
            value={deadlineInput}
            onValueChange={setDeadlineInput}
            placeholder="YYYY-MM-DD (optional)"
            className="border-border bg-background-base text-text-primary mb-1 rounded-lg border px-3 py-2 text-base"
          />
          <Text className="text-text-secondary mb-2 text-sm">
            Add a date to save to your SilverKey calendar; leave empty for a to-do only.
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
                  <EventRequestTimeDropdown
                    value={timeInput}
                    onChange={setTimeInput}
                    options={timeOptions}
                  />
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
    </>
  );
}
