import { useMemo } from "react";

import Dropdown from "packages/ui/components/form/Dropdown";
import { Box, Pressable, Text } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import type { AgendaTodoDTO, AgendaTodoPriority } from "@/features/calendar/types/agenda";

const PRIORITY_OPTIONS: { value: AgendaTodoPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function formatDueLine(dueDate: string) {
  try {
    return dateParseISO(dueDate).toDate().toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

type TodoAgendaRowProps = {
  todo: AgendaTodoDTO;
  onToggleComplete: (id: string) => void;
  onUpdatePriority?: (id: string, priority: AgendaTodoPriority) => void;
  canEditComplete?: boolean;
  canEditPriority?: boolean;
};

export function TodoAgendaRow({
  todo,
  onToggleComplete,
  onUpdatePriority,
  canEditComplete = true,
  canEditPriority = true,
}: TodoAgendaRowProps) {
  const dueLine = useMemo(() => formatDueLine(todo.due_date), [todo.due_date]);

  const priorityClass =
    todo.priority === "low"
      ? "text-text-secondary"
      : todo.priority === "medium"
        ? "text-accent"
        : todo.priority === "high"
          ? "text-primary"
          : "text-destructive";

  return (
    <Box className="border-border bg-background-surface mb-2 ml-2 w-full overflow-hidden rounded-xl border">
      <Box className="flex flex-row items-stretch">
        <Box className="bg-primary w-1" />
        <Box className="flex flex-1 flex-row items-start gap-2 p-3">
          <Pressable
            onPress={() => (canEditComplete ? onToggleComplete(todo.id) : undefined)}
            disabled={!canEditComplete}
            className={`mt-0.5 h-6 w-6 flex-shrink-0 items-center justify-center rounded border-2 ${
              todo.completed
                ? "border-primary bg-primary"
                : canEditComplete
                  ? "border-border active:border-accent"
                  : "border-border"
            }`}
          >
            {todo.completed ? (
              <Text className="text-xs font-semibold text-white">✓</Text>
            ) : null}
          </Pressable>
          <Box className="min-w-0 flex-1 space-y-1">
            <Text
              className={`text-left text-sm font-semibold ${
                todo.completed ? "text-text-disabled line-through" : "text-text-primary"
              }`}
            >
              {todo.title}
            </Text>
            <Box className="flex flex-row flex-wrap items-center gap-2">
              {canEditPriority && onUpdatePriority && !todo.completed ? (
                <Box className="w-28">
                  <Dropdown<AgendaTodoPriority>
                    options={PRIORITY_OPTIONS}
                    value={todo.priority}
                    onChange={(value) => onUpdatePriority(todo.id, value)}
                    variant="compact"
                    size="sm"
                    className="w-full"
                  />
                </Box>
              ) : (
                <Text className={`text-left text-xs font-medium capitalize ${priorityClass}`}>
                  {todo.priority}
                </Text>
              )}
              {dueLine ? (
                <Text className="text-text-secondary text-left text-xs">{dueLine}</Text>
              ) : null}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
