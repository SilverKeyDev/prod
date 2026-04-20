import React, { type ReactNode, useMemo } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { ChecklistType, TaskChecklistItem } from "packages/features/checklists/api/checklists";
import {
  ChecklistStepHeaderSubmitButton,
  ChecklistStepSubmitProvider,
  useChecklistStepSubmitRegistry,
} from "packages/features/checklists/components/ChecklistStepSubmitContext";
import {
  CHECKLIST_TITLES,
  type ChecklistTab,
} from "packages/features/checklists/types/checklists";
import {
  checklistCheckboxRowClassNames,
  toChecklistCheckboxItem,
} from "packages/features/checklists/utils/presentation/checklistCheckboxPresentation";
import type {
  ChecklistItemToggleEligibility,
  RoadmapChecklistBlockerKind,
} from "packages/features/checklists/utils/rules/checklistRules";
import { getFirstIncompleteUnlockSection } from "packages/features/checklists/utils/rules/sectionConfig";
import IconButton from "packages/ui/components/button/IconButton";
import Card from "packages/ui/components/cards/Card";
import ChecklistCheckbox from "packages/ui/components/form/ChecklistCheckbox";
import { Box, Pressable } from "packages/ui/components/primitives";

import ChecklistIntegrationSlot from "./ChecklistIntegrationSlot";

export type BuyerRoadmapChecklistItemRowKind =
  | "flat_item"
  | "completed_item"
  | "current"
  | "upcoming"
  | "future_item";

export type BuyerRoadmapChecklistItemCardProps = {
  item: TaskChecklistItem;
  rowKind: BuyerRoadmapChecklistItemRowKind;
  currentTab: ChecklistTab;
  checkedIds: number[];
  activeItemId: number | null;
  isSectionLocked: boolean;
  hideIntegrationComponents: boolean;
  getItemToggleEligibility: (
    section: ChecklistTab,
    itemId: number
  ) => ChecklistItemToggleEligibility;
  onToggleItem: (id: number) => void | Promise<void>;
  isExpanded: (id: number) => boolean;
  toggleExpand: (id: number) => void;
  hubClientUserId: string | null;
  checklistCategory: ChecklistType | null;
  isAgent: boolean;
  onOpenDispatchModal: (itemId: number) => void;
  renderItemAgentFooter?: (
    item: TaskChecklistItem,
    ctx: ChecklistItemToggleEligibility
  ) => ReactNode;
  getRoadmapItemBlocker: (itemId: number) => RoadmapChecklistBlockerKind | null;
  sectionProgress: Record<ChecklistTab, { isComplete: boolean }>;
  onRoadmapTabNavigate?: (tab: ChecklistTab) => void;
  onRevealRoadmapItem?: (itemId: number) => void;
};

function BuyerRoadmapChecklistItemCardInner({
  item,
  rowKind,
  currentTab,
  checkedIds,
  activeItemId,
  isSectionLocked,
  hideIntegrationComponents,
  getItemToggleEligibility,
  onToggleItem,
  isExpanded,
  toggleExpand,
  hubClientUserId,
  checklistCategory,
  isAgent,
  onOpenDispatchModal,
  renderItemAgentFooter,
  getRoadmapItemBlocker,
  sectionProgress,
  onRoadmapTabNavigate,
  onRevealRoadmapItem,
}: BuyerRoadmapChecklistItemCardProps) {
  const { t } = useLocalization();
  const submitRegistry = useChecklistStepSubmitRegistry();
  const checked = checkedIds.includes(item.id);
  const { canCheck, canUncheck, canMarkChecked } = getItemToggleEligibility(currentTab, item.id);
  const checkboxDisabled = (!checked && !canCheck) || (checked && !canUncheck);
  const roadmapBlocker = useMemo(
    () => (checkboxDisabled ? getRoadmapItemBlocker(item.id) : null),
    [checkboxDisabled, getRoadmapItemBlocker, item.id]
  );
  const sectionGateTarget =
    roadmapBlocker?.kind === "section_gate"
      ? getFirstIncompleteUnlockSection(currentTab, sectionProgress)
      : null;
  const isActive = activeItemId != null && item.id === activeItemId;
  const isRoadmapActiveBlockedUi = Boolean(
    isActive && !checked && checkboxDisabled && roadmapBlocker != null
  );
  const blockerInlineText = useMemo(() => {
    if (!isRoadmapActiveBlockedUi || roadmapBlocker == null) return null;
    if (roadmapBlocker.kind === "prerequisite_item") {
      return roadmapBlocker.blockerLabel;
    }
    if (roadmapBlocker.kind === "section_gate") {
      if (sectionGateTarget == null) {
        return t("checklists.roadmap.finish_previous_phases");
      }
      return CHECKLIST_TITLES[sectionGateTarget];
    }
    if (roadmapBlocker.kind === "submit_via_integration") {
      return t("checklists.roadmap.complete_via_step");
    }
    return t("checklists.roadmap.signature_pending");
  }, [isRoadmapActiveBlockedUi, roadmapBlocker, sectionGateTarget, t]);
  const roadmapSoftBlocked = isRoadmapActiveBlockedUi;
  const roadmapHandoff =
    isRoadmapActiveBlockedUi &&
    (roadmapBlocker?.kind === "prerequisite_item" ||
      (roadmapBlocker?.kind === "section_gate" && sectionGateTarget != null));
  const shouldShowIntegration =
    item.component_key != null && !isSectionLocked && !hideIntegrationComponents;

  const expanded = isExpanded(item.id);
  const isCurrentRow = rowKind === "current";
  const showDetails = isCurrentRow ? true : expanded;
  const showIntegration = shouldShowIntegration && (isCurrentRow || expanded);

  const itemBorder = isActive ? "none" : checked ? "dotted" : "light";
  const checkboxItem = toChecklistCheckboxItem(item);
  const itemLabelClass = `${checklistCheckboxRowClassNames.itemLabel}${
    roadmapSoftBlocked ? " opacity-70" : ""
  }`;
  const handoffAccessibilityLabel = useMemo(() => {
    if (!roadmapHandoff || roadmapBlocker == null || blockerInlineText == null) {
      return checkboxItem.label;
    }
    if (roadmapBlocker.kind === "prerequisite_item") {
      return `${checkboxItem.label}. ${t("checklists.roadmap.finish_blocker_first", {
        blocker: roadmapBlocker.blockerLabel,
      })}`;
    }
    if (roadmapBlocker.kind === "section_gate" && sectionGateTarget != null) {
      return `${checkboxItem.label}. ${t("checklists.roadmap.finish_phase_first", {
        phase: CHECKLIST_TITLES[sectionGateTarget],
      })}`;
    }
    return `${checkboxItem.label}. ${blockerInlineText}`;
  }, [roadmapHandoff, roadmapBlocker, blockerInlineText, checkboxItem.label, sectionGateTarget, t]);
  const agentFooter =
    renderItemAgentFooter?.(item, { canCheck, canUncheck, canMarkChecked }) ?? null;
  const showDispatchGear =
    Boolean(isAgent && hubClientUserId && checklistCategory) &&
    item.dispatchAutomationAvailable === true;

  const hasHeaderSubmit = Boolean(submitRegistry?.registration);

  const handleRoadmapHandoff = () => {
    if (roadmapBlocker?.kind === "prerequisite_item") {
      onRevealRoadmapItem?.(roadmapBlocker.blockerItemId);
      return;
    }
    if (roadmapBlocker?.kind === "section_gate" && sectionGateTarget != null) {
      onRoadmapTabNavigate?.(sectionGateTarget);
    }
  };

  const rowInner = (
    <>
      <Box
        className={`flex w-full flex-row items-stretch ${
          checkboxDisabled && !roadmapSoftBlocked
            ? "bg-background-base opacity-75"
            : "bg-background-surface"
        }`}
      >
        <Box className="flex min-w-0 flex-1 flex-row items-start gap-4 px-4 py-3">
          <Box className="min-w-0 flex-1">
            <ChecklistCheckbox
              item={checkboxItem}
              checked={checked}
              onToggle={() => {
                void onToggleItem(item.id);
              }}
              disabled={checkboxDisabled}
              roadmapSoftBlocked={roadmapSoftBlocked}
              roadmapBlockerInlineText={blockerInlineText}
              roadmapBlockerInlineVariant={
                roadmapBlocker?.kind === "submit_via_integration" ? "integration_hint" : "default"
              }
              showDetails={showDetails}
              itemLabelClass={itemLabelClass}
              itemExplanationClass={checklistCheckboxRowClassNames.itemExplanation}
              checkboxContainerClass={checklistCheckboxRowClassNames.checkboxContainer}
            />
          </Box>
          <Box className="mt-0.5 flex flex-shrink-0 flex-row items-center gap-1">
            {showDispatchGear ? (
              <Box
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && e.stopPropagation()}
              >
                <IconButton
                  variant="ghost"
                  size="sm"
                  iconName="settings"
                  label={t("checklists.dispatch_automation.open_settings", {
                    defaultValue: "Automation settings",
                  })}
                  onPress={() => onOpenDispatchModal(item.id)}
                  className="text-text-secondary hover:text-text-primary flex h-6 w-6"
                />
              </Box>
            ) : null}
            <ChecklistStepHeaderSubmitButton integrationVisible={showIntegration} />
            {roadmapHandoff ? (
              <Icon
                name="chevron-right"
                className="text-gold h-4 w-4 shrink-0 opacity-90"
                aria-hidden
              />
            ) : isCurrentRow ? (
              hasHeaderSubmit ? null : <Box className="h-6 w-6 flex-shrink-0" aria-hidden />
            ) : (
              <Box
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && e.stopPropagation()}
              >
                <IconButton
                  variant="ghost"
                  size="sm"
                  iconName={expanded ? "chevron-down" : "chevron-right"}
                  label={expanded ? "Collapse step" : "Expand step"}
                  onPress={() => toggleExpand(item.id)}
                  className="text-text-secondary hover:text-text-primary flex h-6 w-6"
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      {showIntegration ? (
        <Box className="mt-2 rounded-b-lg px-4 pb-3">
          <ChecklistIntegrationSlot
            componentKey={item.component_key}
            isCurrent={true}
            onComplete={() => {
              if (canMarkChecked) void onToggleItem(item.id);
            }}
          />
        </Box>
      ) : null}
      {agentFooter != null ? <Box className="mt-3 px-4 pb-3">{agentFooter}</Box> : null}
    </>
  );

  return (
    <Card
      border={itemBorder}
      padding="none"
      hover={false}
      className={`m-1.5 w-full overflow-hidden ${
        isActive
          ? "ring-gold shadow-[0_0_3px_rgba(181,168,138,0.6),0_0_10px_rgba(181,168,138,0.35),0_0_20px_rgba(181,168,138,0.15)] ring-1"
          : ""
      }`}
    >
      {roadmapHandoff ? (
        <Pressable onPress={handleRoadmapHandoff} label={handoffAccessibilityLabel}>
          {rowInner}
        </Pressable>
      ) : (
        rowInner
      )}
    </Card>
  );
}

export function BuyerRoadmapChecklistItemCard(props: BuyerRoadmapChecklistItemCardProps) {
  return (
    <ChecklistStepSubmitProvider>
      <BuyerRoadmapChecklistItemCardInner {...props} />
    </ChecklistStepSubmitProvider>
  );
}
