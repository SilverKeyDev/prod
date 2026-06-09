import { useMemo } from "react";

import { Icon } from "packages/ui/components/media/icons";
import { Box, Pressable, Text } from "packages/ui/components/structure/primitives";
import { dateParseISO } from "packages/utils/core/date";

import { AgendaCompleteControl } from "@/features/calendar/components/view/agenda/AgendaCompleteControl";
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
      <Box className="mb-2 w-full max-w-full pl-2">
        <Box className="border-border bg-background-surface w-full overflow-hidden rounded-xl border shadow-sm">
          <Box className="flex flex-row items-stretch">
            <Box className="bg-primary w-1.5" />
            <Box className="flex min-w-0 flex-1 flex-row items-center gap-3 p-3 sm:p-4">
              <Box className="border-border-card-subtle bg-primary-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border">
                <Icon name="check" size={18} className="text-primary" />
              </Box>
              <Box className="flex min-w-0 flex-1 flex-col gap-1">
                <Text className="text-text-primary text-left text-sm font-semibold leading-snug">
                  {todo.title}
                </Text>
                <Text className="text-text-secondary text-left text-xs leading-relaxed">
                  Signed{signedLine ? ` · ${signedLine}` : ""} · DocuSign
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  if (isSigning && agreementId) {
    const body = (
      <Box className="border-border bg-background-surface hover:border-border-card-strong w-full overflow-hidden rounded-xl border shadow-sm transition-shadow duration-200 hover:shadow-md">
        <Box className="flex flex-row items-stretch">
          <Box className="bg-accent w-1.5" />
          <Box className="flex min-w-0 flex-1 flex-row items-center gap-3 p-3 sm:p-4">
            <Box className="border-border-card-subtle bg-accent-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border">
              <Icon name="file-signature" size={18} className="text-primary" />
            </Box>
            <Box className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Text className="text-text-primary text-left text-sm font-semibold leading-snug">
                {todo.title}
              </Text>
              <Box className="flex flex-row flex-wrap items-center gap-x-2 gap-y-1">
                <Text className="text-text-secondary text-left text-xs leading-relaxed">
                  Awaiting your signature
                </Text>
                <Box className="bg-background-base border-border-card-subtle rounded-full border px-2 py-0.5">
                  <Text className="text-text-secondary text-xs font-medium leading-none">
                    DocuSign
                  </Text>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );

    if (onSigningPress) {
      return (
        <Box className="mb-2 w-full max-w-full pl-2">
          <Pressable
            onPress={() => onSigningPress(agreementId)}
            accessibilityRole="button"
            label={`Sign agreement: ${todo.title}`}
            className="min-h-touch focus-visible:ring-primary w-full rounded-xl border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          >
            {body}
          </Pressable>
        </Box>
      );
    }

    return <Box className="mb-2 w-full max-w-full pl-2">{body}</Box>;
  }

  return (
    <Box className="mb-2 w-full max-w-full pl-2">
      <Box className="border-border bg-background-surface w-full overflow-hidden rounded-xl border">
        <Box className="flex flex-row items-stretch">
          <Box className="bg-primary w-1" />
          <Box className="flex min-w-0 flex-1 flex-col gap-1 p-3">
            <Box className="flex min-w-0 flex-row items-center gap-2">
              <AgendaCompleteControl
                completed={todo.completed}
                canToggle={canEditComplete}
                onToggle={() => onToggleComplete(todo.id)}
              />
              <Text
                className={`min-w-0 flex-1 text-left text-sm font-semibold leading-snug ${
                  todo.completed ? "text-text-disabled line-through" : "text-text-primary"
                }`}
              >
                {todo.title}
              </Text>
            </Box>
            {dueLine ? (
              <Box className="flex flex-row flex-wrap items-center gap-2 pl-8">
                <Text className="text-text-secondary text-left text-xs">{dueLine}</Text>
              </Box>
            ) : null}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
