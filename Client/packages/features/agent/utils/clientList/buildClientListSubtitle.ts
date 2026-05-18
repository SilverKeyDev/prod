import type { AgentClient } from "packages/api";
import { CHECKLIST_TITLES, type ChecklistTab } from "packages/features/checklists/types/checklists";
import type { IconName } from "packages/ui/types/icons";

import { pipelineStageTranslationKey } from "@/features/agent/utils/agentClientListLabels";

/** Map API pipeline categories to checklist tabs for icons and titles. */
const API_PHASE_TO_CHECKLIST_TAB: Record<string, ChecklistTab | null> = {
  search: "search",
  offer: "offer",
  escrow: "escrow",
  financing: "financing",
  closing: "closing",
  insurance: "inspections",
  unknown: null,
};

/** Phase tab icons — keep in sync with checklists/utils/roadmap/checklistPhaseIcons. */
const CHECKLIST_PHASE_ICON_NAMES: Record<ChecklistTab, IconName> = {
  search: "search",
  offer: "file-signature",
  escrow: "file-text",
  inspections: "clipboard-check",
  financing: "dollar-sign",
  closing: "home",
};

function getChecklistPhaseIconName(tab: ChecklistTab): IconName {
  return CHECKLIST_PHASE_ICON_NAMES[tab];
}

export type ClientListSubtitleParts = {
  iconName: IconName;
  phaseLabel: string;
  stepLabel: string | null;
};

export function resolveClientListPhaseId(
  client: Pick<AgentClient, "current_phase" | "pipeline_stage">
): string {
  return client.current_phase ?? client.pipeline_stage ?? "search";
}

export function buildClientListSubtitle(
  client: Pick<AgentClient, "current_phase" | "pipeline_stage" | "current_step_label">,
  t: (key: string) => string
): ClientListSubtitleParts {
  const phaseId = resolveClientListPhaseId(client);
  const tab = API_PHASE_TO_CHECKLIST_TAB[phaseId] ?? null;
  const phaseLabel = tab ? CHECKLIST_TITLES[tab] : t(pipelineStageTranslationKey(phaseId));
  const iconName = (tab ? getChecklistPhaseIconName(tab) : null) ?? "file-text";

  const trimmedStep = client.current_step_label?.trim();
  const stepLabel = trimmedStep || null;

  return { iconName, phaseLabel, stepLabel };
}
