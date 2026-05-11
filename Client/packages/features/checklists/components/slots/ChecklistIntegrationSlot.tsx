import React from "react";

import { getChecklistComponent } from "packages/features/checklists/components/integrations/componentRegistry";
import { Box } from "packages/ui/components/primitives";

type ChecklistIntegrationSlotProps = {
  componentKey: string | undefined;
  isCurrent: boolean;
  onComplete: () => void;
};

export default function ChecklistIntegrationSlot({
  componentKey,
  isCurrent,
  onComplete,
}: ChecklistIntegrationSlotProps) {
  if (!componentKey || !isCurrent) return null;

  const Component = getChecklistComponent(componentKey);
  if (!Component) return null;

  return (
    <Box className="mb-3 mt-3">
      <Component onComplete={onComplete} />
    </Box>
  );
}
