import { useMemo } from "react";

import { Icon } from "packages/ui/components/icons";
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
  /** When the row is a DocuSign agenda item, opens the in-app signing flow. */
  onSigningPress?: (agreementId: string) => void;
};

export function TodoAgendaRow({
  todo,
  onToggleComplete,
  canEditComplete = true,
  onSigningPress,
}: TodoAgendaRowProps) {
  const dueLine = useMemo(() => formatDueLine(todo.due_date), [todo.due_date]);
  const isSigning = todo.agenda_item_kind === "signing";
  const agreementId = todo.signing_agreement_id;

  const signedLine = useMemo(() => {
    const raw = todo.signing_completed_at;
    if (raw == null || raw === "") {
      return "";
    }
    try {
      return dateParseISO(raw).toDate().toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  }, [todo.signing_completed_at]);

  if (isSigning && agreementId && todo.completed) {
    return (
      <Box className="border-border bg-background-surface mb-2 ml-2 w-full overflow-hidden rounded-xl border">
        <Box className="flex flex-row items-stretch">
          <Box className="w-1 bg-emerald-600" />
          <Box className="flex flex-1 flex-row items-start gap-2 p-3">
            <Box className="border-border mt-0.5 h-6 w-6 flex-shrink-0 items-center justify-center rounded border-2 border-emerald-600 bg-emerald-50">
              <Icon name="check" size={14} className="text-emerald-800" />
            </Box>
            <Box className="min-w-0 flex-1 space-y-1">
              <Text className="text-left text-sm font-semibold text-text-primary">
                {todo.title}
              </Text>
              <Text className="text-text-secondary text-left text-xs">
                Signed{signedLine ? ` · ${signedLine}` : ""} · DocuSign
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  if (isSigning && agreementId) {
    const body = (
      <Box className="border-border bg-background-surface mb-2 ml-2 w-full overflow-hidden rounded-xl border">
        <Box className="flex flex-row items-stretch">
          <Box className="w-1 bg-amber-500" />
          <Box className="flex flex-1 flex-row items-start gap-2 p-3">
            <Box className="border-border mt-0.5 h-6 w-6 flex-shrink-0 items-center justify-center rounded border-2 border-dashed bg-amber-50">
              <Icon name="file-signature" size={14} className="text-amber-800" />
            </Box>
            <Box className="min-w-0 flex-1 space-y-1">
              <Text className="text-left text-sm font-semibold text-text-primary">
                {todo.title}
              </Text>
              <Text className="text-text-secondary text-left text-xs">
                Awaiting your signature · DocuSign
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    );

    if (onSigningPress) {
      return (
        <Pressable
          onPress={() => onSigningPress(agreementId)}
          accessibilityRole="button"
        >
          {body}
        </Pressable>
      );
    }

    return body;
  }

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
