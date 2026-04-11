import { useMemo } from "react";

import { Box, Pressable, Text } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import type { AgendaTodoDTO } from "@/features/calendar/types/agenda";

function formatDueLine(dueDate: string | null) {
  if (dueDate == null || dueDate === "") {
    return "";
  }
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
  canEditComplete?: boolean;
};

export function TodoAgendaRow({
  todo,
  onToggleComplete,
  canEditComplete = true,
}: TodoAgendaRowProps) {
  const dueLine = useMemo(() => formatDueLine(todo.due_date), [todo.due_date]);

  return (
    <Box className="border-border bg-background-surface mb-2 ml-2 w-full overflow-hidden rounded-xl border">
      <Box className="flex flex-row items-stretch">
        <Box className="bg-primary w-1" />
        <Box className="flex flex-1 flex-row items-start gap-2 p-3">
          <Pressable
            onPress={() =>
              canEditComplete ? onToggleComplete(todo.id) : undefined
            }
            disabled={!canEditComplete}
            className={`mt-0.5 h-6 w-6 flex-shrink-0 items-center justify-center rounded border-2 ${
              todo.completed
                ? "border-primary bg-primary"
                : canEditComplete
                  ? "border-border active:border-neutral-400"
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
                todo.completed
                  ? "text-text-disabled line-through"
                  : "text-text-primary"
              }`}
            >
              {todo.title}
            </Text>
            {dueLine ? (
              <Box className="flex flex-row flex-wrap items-center gap-2">
                <Text className="text-text-secondary text-left text-xs">
                  {dueLine}
                </Text>
              </Box>
            ) : null}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
