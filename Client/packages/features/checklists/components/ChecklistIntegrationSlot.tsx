import React from "react";

import { Box } from "packages/ui/components/primitives";

import { getChecklistComponent } from "./integrations/componentRegistry";

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
