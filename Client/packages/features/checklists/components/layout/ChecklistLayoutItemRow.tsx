import React, { useCallback, useRef, useState } from "react";

import { useLocalization } from "packages/contexts";
import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";
import ChecklistIntegrationSlot from "packages/features/checklists/components/slots/ChecklistIntegrationSlot";
import {
  ChecklistStepHeaderSubmitButton,
  ChecklistStepSubmitProvider,
} from "packages/features/checklists/components/steps/ChecklistStepSubmitContext";
import type { ChecklistCloseLayoutCheckboxItem } from "packages/features/checklists/types/checklistCloseLayout";
import type { ChecklistTab } from "packages/features/checklists/types/checklists";
import { runChecklistIntegrationComplete } from "packages/features/checklists/utils/integration/checklistIntegrationComplete";
import { checklistCheckboxRowClassNames } from "packages/features/checklists/utils/presentation/checklistCheckboxPresentation";
import { CHECKLIST_ROW_INTERACTIVE_SELECTOR } from "packages/features/checklists/utils/presentation/checklistRowInteractiveSelector";
import type { ChecklistItemToggleEligibility } from "packages/features/checklists/utils/rules/checklistRules";
import { showWarningToast } from "packages/hooks/ui/toast/useToast";
import { ChecklistCheckbox } from "packages/ui";
import { ConfirmationDialog } from "packages/ui/components/modals";
import { Box, TouchableBox } from "packages/ui/components/primitives";
import { DOTTED_BORDER_LIGHT_GRAY } from "packages/ui/components/primitives/divider/dividerStyles";

import { IconButton } from "@/components/ui";

const { checkboxContainer, itemLabel, itemExplanation } = checklistCheckboxRowClassNames;

export type ChecklistLayoutItemRowKind =
  | "flat_item"
  | "completed_item"
  | "current"
  | "upcoming"
  | "future_item";

export type ChecklistLayoutItemRowProps = {
  item: TaskChecklistItem;
  rowKind: ChecklistLayoutItemRowKind;
  globalIndex: number;
  checkedById: Record<number, boolean>;
  activeItemIds: readonly number[];
  roadmapTab: ChecklistTab;
  getItemToggleEligibility: (
    section: ChecklistTab,
    itemId: number
  ) => ChecklistItemToggleEligibility;
  /** Guarded toggle (progress rules) for checkbox */
  onToggleItem: (id: number) => void | Promise<void>;
  /** Direct API toggle for integration onComplete */
  commitToggleItem: (id: number) => void | Promise<void>;
  toggleExpand: (id: number) => void;
  isExpanded: (id: number) => boolean;
};

function ChecklistLayoutItemRowInner({
  item,
  rowKind: _rowKind,
  globalIndex,
  checkedById,
  activeItemIds,
  roadmapTab,
  getItemToggleEligibility,
  onToggleItem,
  commitToggleItem,
  toggleExpand,
  isExpanded,
}: ChecklistLayoutItemRowProps) {
  const { t } = useLocalization();
  const rowChecked = !!checkedById[item.id];
  const { canCheck, canUncheck, canMarkChecked } = getItemToggleEligibility(roadmapTab, item.id);
  const checkboxDisabled = (!rowChecked && !canCheck) || (rowChecked && !canUncheck);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleCheckboxToggle = useCallback(() => {
    if (checkboxDisabled) {
      setConfirmOpen(true);
    } else {
      void onToggleItem(item.id);
    }
  }, [checkboxDisabled, item.id, onToggleItem]);

  const handleConfirm = useCallback(() => {
    setConfirmOpen(false);
    void commitToggleItem(item.id);
  }, [commitToggleItem, item.id]);

  const handleCancelConfirm = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  const confirmTitle = rowChecked ? "Uncheck this step?" : "Mark as complete?";
  const confirmMessage = rowChecked
    ? "The system indicates this step should remain completed. You can still uncheck it if needed."
    : "The system indicates you haven't completed the required steps or materials for this item. You can still mark it complete.";
  const confirmText = rowChecked ? "Uncheck anyway" : "Mark complete";

  const commitToggleItemRef = useRef(commitToggleItem);
  commitToggleItemRef.current = commitToggleItem;
  const canMarkCheckedRef = useRef(canMarkChecked);
  canMarkCheckedRef.current = canMarkChecked;

  const handleIntegrationComplete = useCallback(() => {
    runChecklistIntegrationComplete({
      canMarkChecked: () => canMarkCheckedRef.current,
      commitToggleItem: (id) => commitToggleItemRef.current(id),
      itemId: item.id,
      notifyBlocked: () =>
        showWarningToast(
          t("checklists.step_merge_not_applied", {
            defaultValue:
              "This step could not be marked complete yet. Finish earlier steps or required details, then try again.",
          })
        ),
      notifyError: () =>
        showWarningToast(
          t("checklists.update_error", {
            defaultValue: "Could not update this step. Please try again.",
          })
        ),
    });
  }, [item.id, t]);

  const isActive = activeItemIds.includes(item.id);
  const shouldShowIntegration = (item as { component_key?: string }).component_key != null;
  const expanded = isExpanded(item.id);
  // Step expand/collapse is presentation-only: when expanded, show the full step (details +
  // integration) so users can open any row and see all in-step context regardless of which step
  // is active, without visibility implying or changing completion state.
  const showDetails = expanded;
  const showIntegrationBlock = shouldShowIntegration && expanded;

  const handleExpandRowPress = useCallback(() => {
    if (!expanded) {
      toggleExpand(item.id);
    }
  }, [expanded, item.id, toggleExpand]);

  const expandRowAccessibilityLabel = `${item.label}. Expand step`;

  const checklistItem: ChecklistCloseLayoutCheckboxItem = {
    id: item.id,
    label: item.label,
    explanation: item.explanation,
    bullets: item.bullets ?? undefined,
    tip: item.tip ?? undefined,
    resource: item.resource ?? undefined,
    optional: item.optional ?? undefined,
  };

  const headerRow = (
    <Box className="flex flex-row items-start gap-2">
      <Box className="min-w-0 flex-1">
        <ChecklistCheckbox
          item={checklistItem}
          checked={rowChecked}
          onToggle={handleCheckboxToggle}
          itemLabelClass={itemLabel}
          itemExplanationClass={itemExplanation}
          checkboxContainerClass={checkboxContainer}
          number={globalIndex + 1}
          showDetails={showDetails}
        />
      </Box>
      <Box className="mt-0.5 flex flex-shrink-0 flex-row items-center gap-2">
        <ChecklistStepHeaderSubmitButton integrationVisible={showIntegrationBlock} />
        <IconButton
          variant="ghost"
          size="sm"
          iconName={expanded ? "chevron-down" : "chevron-right"}
          label={expanded ? "Collapse step" : "Expand step"}
          onPress={() => toggleExpand(item.id)}
          className="text-text-secondary hover:text-text-primary flex h-6 w-6 flex-shrink-0"
        />
      </Box>
    </Box>
  );

  const collapsedHeaderRow = (
    <TouchableBox
      label={expandRowAccessibilityLabel}
      onPress={handleExpandRowPress}
      className="w-full text-left"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        if (target.closest(CHECKLIST_ROW_INTERACTIVE_SELECTOR)) {
          return;
        }
        if (target.closest("label")) {
          e.preventDefault();
        }
        e.stopPropagation();
        handleExpandRowPress();
      }}
    >
      {headerRow}
    </TouchableBox>
  );

  return (
    <>
      <ConfirmationDialog
        isOpen={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        confirmText={confirmText}
        cancelText="Cancel"
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
      <Box
        className={`w-full rounded-lg px-3 py-2 ${DOTTED_BORDER_LIGHT_GRAY} ${
          isActive
            ? "ring-gold relative z-10 overflow-visible shadow-[0_0_3px_rgba(181,168,138,0.6),0_0_10px_rgba(181,168,138,0.35),0_0_20px_rgba(181,168,138,0.15)] ring-1"
            : ""
        }`}
      >
        {expanded ? headerRow : collapsedHeaderRow}
        {showIntegrationBlock ? (
          <ChecklistIntegrationSlot
            componentKey={(item as { component_key?: string }).component_key}
            isCurrent={true}
            onComplete={handleIntegrationComplete}
          />
        ) : null}
      </Box>
    </>
  );
}

export function ChecklistLayoutItemRow(props: ChecklistLayoutItemRowProps) {
  const { canMarkChecked } = props.getItemToggleEligibility(props.roadmapTab, props.item.id);
  return (
    <ChecklistStepSubmitProvider markCompleteEligible={canMarkChecked}>
      <ChecklistLayoutItemRowInner {...props} />
    </ChecklistStepSubmitProvider>
  );
}
