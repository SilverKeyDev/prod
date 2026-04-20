import { type ReactNode, useMemo } from "react";

import Button from "packages/ui/components/button/Button";
import { Box } from "packages/ui/components/primitives";

export type UseUpcomingAgendaHeaderActionsParams = {
  showDisplayAll: boolean;
  headerActions?: ReactNode;
  openAllAgendaModal: () => void;
};

export function useUpcomingAgendaHeaderActions({
  showDisplayAll,
  headerActions,
  openAllAgendaModal,
}: UseUpcomingAgendaHeaderActionsParams) {
  const agendaHeaderActions = useMemo(() => {
    const displayAllBtn = showDisplayAll ? (
      <Button
        variant="outline"
        size="sm"
        aria-haspopup="dialog"
        onPress={openAllAgendaModal}
        iconName="grid-3x3"
      >
        Display all
      </Button>
    ) : null;

    if (!displayAllBtn && !headerActions) {
      return headerActions;
    }

    return (
      <Box className="flex flex-wrap items-center justify-end gap-2">
        {headerActions ?? null}
        {displayAllBtn}
      </Box>
    );
  }, [showDisplayAll, headerActions, openAllAgendaModal]);

  const eventListHeaderActions = useMemo(() => {
    const displayAllBtn = showDisplayAll ? (
      <Button
        variant="outline"
        size="sm"
        aria-haspopup="dialog"
        onPress={openAllAgendaModal}
        iconName="grid-3x3"
      >
        Display all
      </Button>
    ) : null;

    if (!displayAllBtn && !headerActions) {
      return headerActions;
    }
    return (
      <Box className="flex flex-wrap items-center justify-end gap-2">
        {headerActions ?? null}
        {displayAllBtn}
      </Box>
    );
  }, [showDisplayAll, openAllAgendaModal, headerActions]);

  return { agendaHeaderActions, eventListHeaderActions };
}
