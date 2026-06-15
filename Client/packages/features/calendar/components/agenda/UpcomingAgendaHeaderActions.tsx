import type { ReactNode } from "react";

import { Button } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";

export type UpcomingAgendaHeaderActionsProps = {
  showDisplayAll: boolean;
  headerActions?: ReactNode;
  openAllAgendaModal: () => void;
};

export function UpcomingAgendaHeaderActions({
  showDisplayAll,
  headerActions,
  openAllAgendaModal,
}: UpcomingAgendaHeaderActionsProps) {
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
    return headerActions ?? null;
  }

  return (
    <Box className="flex flex-wrap items-center justify-end gap-2">
      {headerActions ?? null}
      {displayAllBtn}
    </Box>
  );
}
