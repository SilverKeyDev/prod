import React, { useCallback, useState } from "react";

import { CreateEventModal } from "packages/features/calendar";
import { log, LOG_CATEGORIES } from "packages/logger";
import { Box } from "packages/ui/components/primitives";

import {
  BaseModal,
  BodyText,
  Button,
  CancelButton,
  Dropdown,
  Input,
  Label,
} from "@/components/ui";
import type { TodoPriority, TodoType } from "@/features/agent/types/agent";

/** Minimal calendar row for create-event UI (matches Google calendar list shape). */
type AgendaCalendarRow = { id: string; summary: string; primary?: boolean };

type AgentAgendaPlusButtonProps = {
  calendars: AgendaCalendarRow[];
  defaultCalendarId: string | null;
  canCreateEvent: boolean;
  onCreateTodo: (title: string, priority: TodoPriority, type: TodoType) => Promise<void>;
};

export function AgentAgendaPlusButton({
  calendars,
  defaultCalendarId,
  canCreateEvent,
  onCreateTodo,
}: AgentAgendaPlusButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<TodoPriority>("medium");

  const openTodoModal = useCallback(() => {
    setMenuOpen(false);
    setTodoModalOpen(true);
  }, []);

  const openEventModal = useCallback(() => {
    setMenuOpen(false);
    setEventModalOpen(true);
  }, []);

  const handleSubmitTodo = useCallback(async () => {
    const trimmed = newTodoTitle.trim();
    if (!trimmed) {
      return;
    }
    try {
      await onCreateTodo(trimmed, selectedPriority, "manual");
      setNewTodoTitle("");
      setSelectedPriority("medium");
      setTodoModalOpen(false);
    } catch (error) {
      log.error(LOG_CATEGORIES.DASHBOARD, "Failed to create todo from agenda menu", error);
    }
  }, [newTodoTitle, onCreateTodo, selectedPriority]);

  const handleCloseTodoModal = useCallback(() => {
    setTodoModalOpen(false);
    setNewTodoTitle("");
    setSelectedPriority("medium");
  }, []);

  return (
    <Box className="relative">
      <Button
        variant="outline"
        size="sm"
        iconName="plus"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onPress={() => setMenuOpen((o) => !o)}
      >
        Add
      </Button>
      {menuOpen ? (
        <Box
          className="border-border bg-background-surface absolute right-0 top-full z-20 mt-1 min-w-44 rounded-lg border py-1 shadow-md"
          role="menu"
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-auto w-full justify-start rounded-none px-3 py-2 font-normal"
            onPress={openTodoModal}
          >
            Add to-do
          </Button>
          {canCreateEvent ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto w-full justify-start rounded-none px-3 py-2 font-normal"
              onPress={openEventModal}
            >
              Add calendar event
            </Button>
          ) : null}
        </Box>
      ) : null}

      <BaseModal isOpen={todoModalOpen} onClose={handleCloseTodoModal} title="Add to-do">
        <Box className="gap-3 p-1">
          <Box>
            <Label htmlFor="agenda-todo-title" size="sm">
              Title
            </Label>
            <Input
              id="agenda-todo-title"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="What do you need to do?"
              className="mt-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleSubmitTodo();
                }
              }}
            />
          </Box>
          <Box>
            <Dropdown<TodoPriority>
              label="Priority"
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "urgent", label: "Urgent" },
              ]}
              value={selectedPriority}
              onChange={(v) => setSelectedPriority(v)}
              variant="compact"
              size="sm"
            />
          </Box>
          <Box className="mt-2 flex flex-row gap-2">
            <Button variant="primary" size="sm" className="flex-1" onPress={() => void handleSubmitTodo()}>
              Save
            </Button>
            <CancelButton size="sm" className="flex-1" onPress={handleCloseTodoModal}>
              Cancel
            </CancelButton>
          </Box>
          <BodyText size="xs" muted>
            Due date defaults to end of today.
          </BodyText>
        </Box>
      </BaseModal>

      {canCreateEvent && calendars.length > 0 ? (
        <CreateEventModal
          isOpen={eventModalOpen}
          onClose={() => setEventModalOpen(false)}
          calendars={calendars}
          defaultCalendarId={defaultCalendarId ?? undefined}
          onEventCreated={() => setEventModalOpen(false)}
        />
      ) : null}
    </Box>
  );
}
