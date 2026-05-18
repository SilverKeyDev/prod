import type { ChecklistTab } from "packages/features/checklists/types/checklists";
import type { Phase, PhaseStatus } from "packages/features/checklists/types/roadmapTracker";
import { SECTION_ORDER } from "packages/features/checklists/utils/rules/sectionConfig";

export type SectionProgressSlice = {
  completed: number;
  total: number;
  isComplete: boolean;
};

export type BuildBuyerRoadmapPhasesParams = {
  sectionProgress: Record<ChecklistTab, SectionProgressSlice>;
  isSectionUnlocked: (section: ChecklistTab) => boolean;
  labelsByTab: Record<ChecklistTab, string>;
  selectedPhaseId: ChecklistTab;
  journeyPhaseId: ChecklistTab;
};

function phaseStatusForTab(
  tab: ChecklistTab,
  sectionProgress: Record<ChecklistTab, SectionProgressSlice>,
  isSectionUnlocked: (section: ChecklistTab) => boolean,
  journeyPhaseId: ChecklistTab
): PhaseStatus {
  if (!isSectionUnlocked(tab)) return "locked";
  const slice = sectionProgress[tab];
  if (slice.isComplete) return "complete";
  if (tab === journeyPhaseId) return "active";
  return "available";
}

/**
 * Maps buyer checklist progress into {@link Phase} rows for {@link RoadmapTracker}.
 */
export function buildBuyerRoadmapPhases({
  sectionProgress,
  isSectionUnlocked,
  labelsByTab,
  selectedPhaseId,
  journeyPhaseId,
}: BuildBuyerRoadmapPhasesParams): Phase[] {
  return SECTION_ORDER.map((tab) => {
    const slice = sectionProgress[tab];
    return {
      id: tab,
      label: labelsByTab[tab],
      status: phaseStatusForTab(tab, sectionProgress, isSectionUnlocked, journeyPhaseId),
      completedTasks: slice.completed,
      totalTasks: slice.total,
      isSelected: tab === selectedPhaseId,
    };
  });
}
