import { type ReactNode, useMemo } from "react";

import Button from "packages/ui/components/button/Button";
import { Box } from "packages/ui/components/primitives";

export type UseUpcomingAgendaHeaderActionsParams = {
  showDisplayAll: boolean;
  useAgendaList: boolean;
  completedTodoCount: number;
  headerActions?: ReactNode;
  openAllAgendaModal: () => void;
  openCompletedTodosModal: () => void;
};

export function useUpcomingAgendaHeaderActions({
  showDisplayAll,
  useAgendaList,
  completedTodoCount,
  headerActions,
  openAllAgendaModal,
  openCompletedTodosModal,
}: UseUpcomingAgendaHeaderActionsParams) {
  const agendaHeaderActions = useMemo(() => {
    const completedBtn =
      useAgendaList && completedTodoCount > 0 ? (
        <Button
          variant="ghost"
          size="sm"
          aria-haspopup="dialog"
          onPress={openCompletedTodosModal}
        >
          View all
        </Button>
      ) : null;

    const displayAllBtn = showDisplayAll ? (
      <Button
        variant="ghost"
        size="sm"
        aria-haspopup="dialog"
        onPress={openAllAgendaModal}
      >
        Display all
      </Button>
    ) : null;

    if (!displayAllBtn && !completedBtn && !headerActions) {
      return headerActions;
    }

    return (
      <Box className="flex flex-wrap items-center justify-end gap-2">
        {displayAllBtn}
        {completedBtn}
        {headerActions ?? null}
      </Box>
    );
  }, [
    showDisplayAll,
    useAgendaList,
    completedTodoCount,
    headerActions,
    openAllAgendaModal,
    openCompletedTodosModal,
  ]);

  const eventListHeaderActions = useMemo(() => {
    const displayAllBtn = showDisplayAll ? (
      <Button
        variant="ghost"
        size="sm"
        aria-haspopup="dialog"
        onPress={openAllAgendaModal}
      >
        Display all
      </Button>
    ) : null;

    if (!displayAllBtn && !headerActions) {
      return headerActions;
    }
    return (
      <Box className="flex flex-wrap items-center justify-end gap-2">
        {displayAllBtn}
        {headerActions ?? null}
      </Box>
    );
  }, [showDisplayAll, openAllAgendaModal, headerActions]);

  return { agendaHeaderActions, eventListHeaderActions };
}
