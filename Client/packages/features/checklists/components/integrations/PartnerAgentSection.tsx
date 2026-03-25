import React from "react";

import type { ChecklistIntegrationComponentProps } from "packages/features/checklists/types/componentRegistry";
import { AgentSearchContent } from "packages/hooks/data/checklistAgentSearchContent";

/**
 * Checklist step "Partner with a real estate agent": shows agent search UI inline (no modal, no button).
 * When the user sends a connection request, onComplete is called so the step can be marked done.
 */
export default function PartnerAgentSection({ onComplete }: ChecklistIntegrationComponentProps) {
  return (
    <AgentSearchContent
      isActive={true}
      onSuccess={onComplete}
      className="border-border rounded-lg border p-4"
    />
  );
}
