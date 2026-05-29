import React from "react";

import { getChecklistComponent } from "packages/features/checklists/components/integrations/componentRegistry";
import type { ChecklistTab } from "packages/features/checklists/types/checklists";
import { PartnerRevSharePlacement } from "packages/features/partners";
import { usePartnerPlacements } from "packages/features/partners/hooks/usePartnerPlacements";
import { Box } from "packages/ui/components/primitives";
import { buildStepId } from "packages/utils/checklists/stepId";

type ChecklistIntegrationSlotProps = {
  componentKey: string | undefined;
  isCurrent: boolean;
  onComplete: () => void;
  roadmapTab: ChecklistTab;
  itemId: number;
  transactionSubjectId?: string | null;
};

/** Checklist keys that render partner placements as the primary integration UI. */
const PARTNER_TRANSACTION_INTEGRATION_KEYS = new Set(["home_concierge"]);

export default function ChecklistIntegrationSlot({
  componentKey,
  isCurrent,
  onComplete,
  roadmapTab,
  itemId,
  transactionSubjectId,
}: ChecklistIntegrationSlotProps) {
  const active = Boolean(componentKey && isCurrent);
  const stepId = active ? buildStepId(roadmapTab, itemId) : undefined;
  const { data: placements = [], isLoading } = usePartnerPlacements(
    stepId,
    transactionSubjectId ?? undefined
  );

  if (!active) return null;

  const Component = getChecklistComponent(componentKey!);
  if (!Component) return null;

  const isPartnerTransactionIntegration = PARTNER_TRANSACTION_INTEGRATION_KEYS.has(componentKey!);

  return (
    <Box className="mb-3 mt-3">
      {!isPartnerTransactionIntegration ? (
        <PartnerRevSharePlacement
          stepId={stepId!}
          transactionSubjectId={transactionSubjectId}
          placements={placements}
          isLoading={isLoading}
        />
      ) : null}
      <Component
        onComplete={onComplete}
        stepId={stepId}
        transactionSubjectId={transactionSubjectId}
        placements={placements}
        placementsLoading={isLoading}
      />
    </Box>
  );
}
