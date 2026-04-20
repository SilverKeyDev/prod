import React, { useCallback, useState } from "react";

import { Modal, Pressable as ModalPressable, StyleSheet } from "react-native";

import { log, LOG_CATEGORIES } from "packages/logger";
import Button from "packages/ui/components/button/Button";
import { Box, Pressable, PrimitiveInput, Text } from "packages/ui/components/primitives";
import { dayjs } from "packages/utils/date";

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheetWrap: {
    width: "100%",
  },
});

export type MobileAgendaAddButtonProps = {
  onSubmitTodo: (payload: {
    title: string;
    description: string | null;
    deadlineDate: string | null;
    deadlineTime: string | null;
  }) => Promise<void>;
};

export function MobileAgendaAddButton({ onSubmitTodo }: MobileAgendaAddButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [deadlineInput, setDeadlineInput] = useState("");
  const [timeInput, setTimeInput] = useState("");

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setNewTodoTitle("");
    setDescriptionInput("");
    setDeadlineInput("");
    setTimeInput("");
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
    const rawTime = timeInput.trim();
    const deadlineTime = rawTime === "" ? null : rawTime;
    const descTrimmed = descriptionInput.trim();
    try {
      await onSubmitTodo({
        title: trimmed,
        description: descTrimmed === "" ? null : descTrimmed,
        deadlineDate,
        deadlineTime,
      });
      closeModal();
    } catch (error) {
      log.error(LOG_CATEGORIES.DASHBOARD, "Failed to add agenda item (mobile)", error);
    }
  }, [closeModal, deadlineInput, descriptionInput, newTodoTitle, onSubmitTodo, timeInput]);

  return (
    <>
      <Pressable
        onPress={() => setModalOpen(true)}
        className="border-border flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-dashed px-3 py-2 active:opacity-80"
      >
        <Text className="text-primary text-center text-sm font-medium">Add</Text>
      </Pressable>

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={closeModal}>
        <ModalPressable style={modalStyles.backdrop} onPress={closeModal}>
          <ModalPressable
            style={modalStyles.sheetWrap}
            onPress={(e) => {
              e.stopPropagation();
            }}
          >
            <Box className="bg-background-surface max-h-[85%] w-full rounded-t-2xl px-4 pb-8 pt-4">
              <Text className="text-text-primary mb-2 text-base font-semibold">Add to agenda</Text>
              <Text className="text-text-secondary mb-1 text-xs">Title</Text>
              <PrimitiveInput
                value={newTodoTitle}
                onValueChange={setNewTodoTitle}
                placeholder="Task name"
                className="border-border bg-background-base text-text-primary mb-3 rounded-lg border px-3 py-2 text-base"
              />
              <Text className="text-text-secondary mb-1 text-xs">Description (optional)</Text>
              <PrimitiveInput
                value={descriptionInput}
                onValueChange={setDescriptionInput}
                placeholder="Notes (optional)"
                multiline
                textAlignVertical="top"
                className="border-border bg-background-base text-text-primary mb-3 min-h-20 rounded-lg border px-3 py-2 text-base"
              />
              <Text className="text-text-secondary mb-1 text-xs">Date (optional, YYYY-MM-DD)</Text>
              <PrimitiveInput
                value={deadlineInput}
                onValueChange={setDeadlineInput}
                placeholder="YYYY-MM-DD (optional)"
                className="border-border bg-background-base text-text-primary mb-1 rounded-lg border px-3 py-2 text-base"
              />
              <Text className="text-text-secondary mb-2 text-xs">
                Add a date to save to your SilverKey calendar; leave empty for a to-do only.
              </Text>
              <Text className="text-text-secondary mb-1 text-xs">Time (optional, HH:mm)</Text>
              <PrimitiveInput
                value={timeInput}
                onValueChange={setTimeInput}
                placeholder="e.g. 14:30 (24-hour)"
                className="border-border bg-background-base text-text-primary mb-4 rounded-lg border px-3 py-2 text-base"
              />
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
            </Box>
          </ModalPressable>
        </ModalPressable>
      </Modal>
    </>
  );
}
