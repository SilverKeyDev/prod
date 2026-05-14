import React, { type ReactNode, useMemo } from "react";

import { ChecklistUpdatePendingContext } from "packages/features/checklists/components/roadmap/checklistUpdatePendingContext";

export function ChecklistUpdatePendingProvider({
  value,
  children,
}: {
  value: boolean;
  children: ReactNode;
}) {
  const memo = useMemo(() => value, [value]);
  return (
    <ChecklistUpdatePendingContext.Provider value={memo}>
      {children}
    </ChecklistUpdatePendingContext.Provider>
  );
}
