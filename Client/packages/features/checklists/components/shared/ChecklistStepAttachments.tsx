import React, { type ReactNode } from "react";

import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";
import ChecklistIntegrationSlot from "packages/features/checklists/components/slots/ChecklistIntegrationSlot";
import type { ChecklistTab } from "packages/features/checklists/types/checklists";
import { Box } from "packages/ui/components/primitives";

type ChecklistStepAttachmentsProps = {
  item: TaskChecklistItem;
  expanded: boolean;
  hideIntegrationComponents?: boolean;
  roadmapTab: ChecklistTab;
  transactionSubjectId?: string | null;
  onIntegrationComplete: () => void;
  renderItemAgentFooter?: ReactNode;
  renderItemFooter?: ReactNode;
  integrationClassName?: string;
};

export function ChecklistStepAttachments({
  item,
  expanded,
  hideIntegrationComponents = false,
  roadmapTab,
  transactionSubjectId,
  onIntegrationComplete,
  renderItemAgentFooter,
  renderItemFooter,
  integrationClassName = "mt-2 rounded-b-lg px-4 pb-3",
}: ChecklistStepAttachmentsProps) {
  if (!expanded) {
    return null;
  }

  const shouldShowIntegration = item.component_key != null && !hideIntegrationComponents;

  return (
    <>
      {shouldShowIntegration ? (
        <Box className={integrationClassName}>
          <ChecklistIntegrationSlot
            componentKey={item.component_key}
            isCurrent
            onComplete={onIntegrationComplete}
            roadmapTab={roadmapTab}
            itemId={item.id}
            transactionSubjectId={transactionSubjectId}
          />
        </Box>
      ) : null}
      {renderItemAgentFooter}
      {renderItemFooter}
    </>
  );
}
