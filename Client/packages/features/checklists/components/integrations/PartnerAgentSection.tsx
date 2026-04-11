import React from "react";

import type { ChecklistIntegrationComponentProps } from "packages/features/checklists/types/componentRegistry";

import { AgentSearchPanel } from "@/features/agent/components/AgentSearchPanel";

/**
 * Checklist step "Partner with a real estate agent": same shell as messaging `AgentSearchModal`
 * (modal and this step both use `AgentSearchPanel`, which wraps `AgentSearchContent`).
 * Inline here (no overlay). When the user sends a connection request, onComplete runs.
 */
export default function PartnerAgentSection({
  onComplete,
}: ChecklistIntegrationComponentProps) {
  return <AgentSearchPanel isActive onSuccess={onComplete} />;
}
