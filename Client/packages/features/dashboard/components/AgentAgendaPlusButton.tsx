import React, { useCallback, useState } from "react";

import { log, LOG_CATEGORIES } from "packages/logger";
import { Box } from "packages/ui/components/primitives";

import { BaseModal, BodyText, Button, CancelButton, Dropdown, Input, Label } from "@/components/ui";
import type { TodoPriority } from "@/features/agent/types/agent";

const PRIORITY_OPTIONS: { value: TodoPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export type AgentAgendaTodoFormPayload = {
  title: string;
  priority: TodoPriority | null;
  deadlineDate: string | null;
};

type AgentAgendaPlusButtonProps = {
  onSubmitAgentTodo: (payload: AgentAgendaTodoFormPayload) => Promise<void>;
};

export function AgentAgendaPlusButton({ onSubmitAgentTodo }: AgentAgendaPlusButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<TodoPriority | null>(null);
  const [deadlineDate, setDeadlineDate] = useState("");

  const resetForm = useCallback(() => {
    setNewTodoTitle("");
    setSelectedPriority(null);
    setDeadlineDate("");
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmed = newTodoTitle.trim();
    if (!trimmed) {
      return;
    }
    const deadline = deadlineDate.trim() === "" ? null : deadlineDate.trim();
    try {
      await onSubmitAgentTodo({
        title: trimmed,
        priority: selectedPriority,
        deadlineDate: deadline,
      });
      resetForm();
      setModalOpen(false);
    } catch (error) {
      log.error(LOG_CATEGORIES.DASHBOARD, "Failed to add agenda item", error);
    }
  }, [deadlineDate, newTodoTitle, onSubmitAgentTodo, resetForm, selectedPriority]);

  const handleClose = useCallback(() => {
    setModalOpen(false);
    resetForm();
  }, [resetForm]);

  return (
    <Box className="relative">
      <Button
        variant="outline"
        size="sm"
        iconName="plus"
        aria-haspopup="dialog"
        onPress={() => setModalOpen(true)}
      >
        Add
      </Button>

      <BaseModal isOpen={modalOpen} onClose={handleClose} title="Add to agenda">
        <Box className="gap-3 p-1">
          <BodyText size="xs" muted>
            When Google Calendar is connected, this adds an all-day event. Otherwise it saves as a
            to-do.
          </BodyText>
          <Box>
            <Label htmlFor="agenda-item-title" size="sm">
              Title
            </Label>
            <Input
              id="agenda-item-title"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="What do you need to do?"
              className="mt-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleSubmit();
                }
              }}
            />
          </Box>
          <Box>
            <Dropdown<TodoPriority>
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={selectedPriority ?? undefined}
              placeholder="Optional"
              clearable
              onClear={() => setSelectedPriority(null)}
              onChange={(value) => setSelectedPriority(value)}
              variant="compact"
              size="sm"
            />
          </Box>
          <Box>
            <Label htmlFor="agenda-item-deadline" size="sm">
              Date
            </Label>
            <Input
              id="agenda-item-deadline"
              type="date"
              value={deadlineDate}
              onChange={(e) => setDeadlineDate(e.target.value)}
              className="mt-1"
            />
            <BodyText size="xs" muted className="mt-1">
              Optional. If empty, the item uses today when on your calendar.
            </BodyText>
          </Box>
          <Box className="mt-2 flex flex-row gap-2">
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onPress={() => void handleSubmit()}
            >
              Save
            </Button>
            <CancelButton size="sm" className="flex-1" onPress={handleClose}>
              Cancel
            </CancelButton>
          </Box>
        </Box>
      </BaseModal>
    </Box>
  );
}
