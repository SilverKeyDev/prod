import React, { type ReactNode, useCallback, useMemo } from "react";

import { useLocalization } from "packages/contexts";
import type { ChecklistType, TaskChecklistItem } from "packages/features/checklists/api/checklists";
import { ChecklistStepAttachments } from "packages/features/checklists/components/shared/ChecklistStepAttachments";
import {
  ChecklistStepHeaderSubmitButton,
  ChecklistStepSubmitProvider,
} from "packages/features/checklists/components/steps/ChecklistStepSubmitContext";
import { useChecklistIntegrationCompleteHandler } from "packages/features/checklists/hooks/useChecklistIntegrationCompleteHandler";
import { CHECKLIST_TITLES, type ChecklistTab } from "packages/features/checklists/types/checklists";
import {
  checklistCheckboxRowClassNames,
  checklistRowShellClassNames,
  getChecklistItemBorderVariant,
  getChecklistItemLabelClass,
  toChecklistCheckboxItem,
} from "packages/features/checklists/utils/presentation/checklistCheckboxPresentation";
import { CHECKLIST_ROW_INTERACTIVE_SELECTOR } from "packages/features/checklists/utils/presentation/checklistRowInteractiveSelector";
import type {
  ChecklistItemToggleEligibility,
  RoadmapChecklistBlockerKind,
} from "packages/features/checklists/utils/rules/checklistRules";
import { getFirstIncompleteUnlockSection } from "packages/features/checklists/utils/rules/sectionConfig";
import { IconButton } from "packages/ui";
import { ChecklistCheckbox } from "packages/ui";
import { Box, TouchableBox } from "packages/ui/components/structure/primitives";
import Card from "packages/ui/components/surfaces/cards/Card";

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
  activeItemIds: readonly number[];
  isSectionLocked: boolean;
  hideIntegrationComponents: boolean;
  getItemToggleEligibility: (
    section: ChecklistTab,
    itemId: number
  ) => ChecklistItemToggleEligibility;
  onToggleItem: (id: number) => void | Promise<void>;
  /** Raw checklist write after integration submit (see `BuyerRoadmapChecklistListProps.commitToggleItem`). */
  commitToggleItem: (id: number) => void | Promise<void>;
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
  /**
   * Rendered below the integration slot for all users (not agent-only).
   * Use this to display signing cards or other step-level content (e.g. TodoAgendaRow).
   * Return null to skip.
   */
  renderItemFooter?: (item: TaskChecklistItem) => ReactNode;
  getRoadmapItemBlocker: (itemId: number) => RoadmapChecklistBlockerKind | null;
  sectionProgress: Record<ChecklistTab, { isComplete: boolean }>;
  onRoadmapTabNavigate?: (tab: ChecklistTab) => void;
  onRevealRoadmapItem?: (itemId: number) => void;
  /** When true, row checkbox and integration complete are disabled (checklist PUT in flight). */
  isChecklistUpdatePending?: boolean;
  transactionId?: string | null;
};

function BuyerRoadmapChecklistItemCardInner({
  item,
  rowKind: _rowKind,
  currentTab,
  checkedIds,
  activeItemIds,
  hideIntegrationComponents,
  getItemToggleEligibility,
  onToggleItem,
  commitToggleItem,
  isExpanded,
  toggleExpand,
  hubClientUserId,
  checklistCategory,
  isAgent,
  onOpenDispatchModal,
  renderItemAgentFooter,
  renderItemFooter,
  getRoadmapItemBlocker,
  sectionProgress,
  onRoadmapTabNavigate,
  onRevealRoadmapItem,
  isChecklistUpdatePending = false,
  transactionId,
}: BuyerRoadmapChecklistItemCardProps) {
  const { t } = useLocalization();
  const checked = checkedIds.includes(item.id);
  const { canCheck, canUncheck, canMarkChecked } = getItemToggleEligibility(currentTab, item.id);
  const checkboxDisabled =
    (!checked && !canCheck) || (checked && !canUncheck) || Boolean(isChecklistUpdatePending);
  const roadmapBlocker = useMemo(
    () => (checkboxDisabled ? getRoadmapItemBlocker(item.id) : null),
    [checkboxDisabled, getRoadmapItemBlocker, item.id]
  );
  const sectionGateTarget =
    roadmapBlocker?.kind === "section_gate"
      ? getFirstIncompleteUnlockSection(currentTab, sectionProgress)
      : null;
  const isActive = activeItemIds.includes(item.id);
  const isRoadmapActiveBlockedUi = Boolean(
    isActive && !checked && checkboxDisabled && roadmapBlocker != null
  );
  const blockerInlineText = useMemo(() => {
    if (!isRoadmapActiveBlockedUi || roadmapBlocker == null) return null;
    if (roadmapBlocker.kind === "prerequisite_item") {
      return roadmapBlocker.showInlinePrerequisiteLabel ? roadmapBlocker.blockerLabel : null;
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
  const shouldShowIntegration = item.component_key != null && !hideIntegrationComponents;

  const expanded = isExpanded(item.id);
  // Step expand/collapse is presentation-only: when expanded, show the full step (checkbox copy,
  // integration slot, footers) so users can pull in all available context for any item, active or
  // not, without that visibility implying or changing completion state.
  const showDetails = expanded;
  const showIntegration = shouldShowIntegration && expanded;

  const itemBorder = getChecklistItemBorderVariant(checked);
  const checkboxItem = toChecklistCheckboxItem(item);
  const itemLabelClass = getChecklistItemLabelClass({
    checked,
    disabled: checkboxDisabled,
    roadmapSoftBlocked,
  });
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
  const itemFooter = renderItemFooter?.(item) ?? null;

  const handleIntegrationComplete = useChecklistIntegrationCompleteHandler({
    itemId: item.id,
    commitToggleItem,
    canMarkChecked,
  });
  const showDispatchGear =
    Boolean(isAgent && hubClientUserId && checklistCategory) &&
    item.dispatchAutomationAvailable === true;

  const handleRoadmapHandoff = () => {
    if (roadmapBlocker?.kind === "prerequisite_item") {
      onRevealRoadmapItem?.(roadmapBlocker.blockerItemId);
      return;
    }
    if (roadmapBlocker?.kind === "section_gate" && sectionGateTarget != null) {
      onRoadmapTabNavigate?.(sectionGateTarget);
    }
  };

  const handleExpandRowPress = useCallback(() => {
    if (!expanded) {
      toggleExpand(item.id);
    }
  }, [expanded, item.id, toggleExpand]);

  const handleCheckboxToggle = useCallback(() => {
    void onToggleItem(item.id);
  }, [item.id, onToggleItem]);

  const ignoreNestedRowPress = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    return Boolean(target.closest(CHECKLIST_ROW_INTERACTIVE_SELECTOR));
  }, []);

  const wrapRowPressTarget = useCallback(
    (label: string, onPress: () => void, content: React.ReactNode) => (
      <TouchableBox
        label={label}
        onPress={onPress}
        className="w-full text-left"
        onClick={(e: React.MouseEvent<HTMLDivElement>) => {
          if (ignoreNestedRowPress(e)) {
            return;
          }
          e.stopPropagation();
          onPress();
        }}
      >
        {content}
      </TouchableBox>
    ),
    [ignoreNestedRowPress]
  );

  const expandRowAccessibilityLabel = `${checkboxItem.label}. ${t(
    "checklists.roadmap.expand_step",
    {
      defaultValue: "Expand step",
    }
  )}`;

  const toggleRowAccessibilityLabel = `${checkboxItem.label}. ${t(
    "checklists.roadmap.toggle_step",
    {
      defaultValue: "Toggle step",
    }
  )}`;

  const checkboxRowInner = (
    <Box
      className={`flex w-full flex-row items-stretch ${
        checkboxDisabled && !roadmapSoftBlocked ? "bg-background-base" : "bg-background-surface"
      }`}
    >
      <Box
        className={`flex min-w-0 flex-1 flex-row items-start gap-4 ${checklistRowShellClassNames.innerPadding}`}
      >
        <Box className="min-w-0 flex-1">
          <ChecklistCheckbox
            item={checkboxItem}
            checked={checked}
            onToggle={handleCheckboxToggle}
            disabled={checkboxDisabled}
            deferInteractionToParent
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
        <Box className="mt-0.5 flex flex-shrink-0 flex-row items-center gap-2">
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
        </Box>
      </Box>
    </Box>
  );

  const checkboxRow = roadmapHandoff
    ? wrapRowPressTarget(handoffAccessibilityLabel, handleRoadmapHandoff, checkboxRowInner)
    : !expanded
      ? wrapRowPressTarget(expandRowAccessibilityLabel, handleExpandRowPress, checkboxRowInner)
      : wrapRowPressTarget(toggleRowAccessibilityLabel, handleCheckboxToggle, checkboxRowInner);

  const integrationBlock = (
    <ChecklistStepAttachments
      item={item}
      expanded={expanded}
      hideIntegrationComponents={hideIntegrationComponents}
      roadmapTab={currentTab}
      transactionId={transactionId}
      onIntegrationComplete={handleIntegrationComplete}
      renderItemAgentFooter={agentFooter}
      renderItemFooter={itemFooter}
    />
  );

  const rowInner = (
    <>
      {checkboxRow}
      {integrationBlock}
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
      {rowInner}
    </Card>
  );
}

export function BuyerRoadmapChecklistItemCard(props: BuyerRoadmapChecklistItemCardProps) {
  const { canMarkChecked } = props.getItemToggleEligibility(props.currentTab, props.item.id);
  return (
    <ChecklistStepSubmitProvider markCompleteEligible={canMarkChecked}>
      <BuyerRoadmapChecklistItemCardInner {...props} />
    </ChecklistStepSubmitProvider>
  );
}
