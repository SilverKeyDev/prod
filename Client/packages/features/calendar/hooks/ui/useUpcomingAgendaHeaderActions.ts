import { createElement, type ReactNode, useMemo } from "react";

import { UpcomingAgendaHeaderActions } from "@/features/calendar/components/agenda/UpcomingAgendaHeaderActions";

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
  const headerActionsProps = useMemo(
    () => ({ showDisplayAll, headerActions, openAllAgendaModal }),
    [showDisplayAll, headerActions, openAllAgendaModal]
  );

  const agendaHeaderActions = useMemo(
    () => createElement(UpcomingAgendaHeaderActions, headerActionsProps),
    [headerActionsProps]
  );

  const eventListHeaderActions = agendaHeaderActions;

  return { agendaHeaderActions, eventListHeaderActions };
}
