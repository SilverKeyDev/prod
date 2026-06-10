import { useCallback } from "react";

import { useAgendaCompletionStore } from "packages/store/slices/ui/agendaCompletion.slice";

import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import { agendaEventCompletionKey } from "@/features/calendar/utils/agenda/agendaEventCompletionKey";

export function useAgendaEventCompletion() {
  const completedEventKeys = useAgendaCompletionStore((s) => s.completedEventKeys);
  const toggleAgendaEventComplete = useAgendaCompletionStore((s) => s.toggleAgendaEventComplete);

  const isAgendaEventComplete = useCallback(
    (event: ExtendedGoogleEvent) => Boolean(completedEventKeys[agendaEventCompletionKey(event)]),
    [completedEventKeys]
  );

  const onToggleAgendaEventComplete = useCallback(
    (event: ExtendedGoogleEvent) => {
      toggleAgendaEventComplete(agendaEventCompletionKey(event));
    },
    [toggleAgendaEventComplete]
  );

  return { isAgendaEventComplete, onToggleAgendaEventComplete, completedEventKeys };
}
