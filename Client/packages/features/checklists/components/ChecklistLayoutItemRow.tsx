import React from "react";

import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";
import {
  ChecklistStepHeaderSubmitButton,
  ChecklistStepSubmitProvider,
  useChecklistStepSubmitRegistry,
} from "packages/features/checklists/components/ChecklistStepSubmitContext";
import type { ChecklistCloseLayoutCheckboxItem } from "packages/features/checklists/types/checklistCloseLayout";
import type { ChecklistTab } from "packages/features/checklists/types/checklists";
import { checklistCheckboxRowClassNames } from "packages/features/checklists/utils/presentation/checklistCheckboxPresentation";
import type { ChecklistItemToggleEligibility } from "packages/features/checklists/utils/rules/checklistRules";
import ChecklistCheckbox from "packages/ui/components/form/ChecklistCheckbox";
import { Box } from "packages/ui/components/primitives";
import { DOTTED_BORDER_LIGHT_GRAY } from "packages/ui/components/primitives/divider/dividerStyles";

import { IconButton } from "@/components/ui";

import ChecklistIntegrationSlot from "./ChecklistIntegrationSlot";

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
  activeItemId: number | null;
  roadmapTab: ChecklistTab;
  getItemToggleEligibility: (
    section: ChecklistTab,
    itemId: number
  ) => ChecklistItemToggleEligibility;
  /** Guarded toggle (progress rules) for checkbox */
  onToggleItem: (id: number) => void;
  /** Direct API toggle for integration onComplete */
  commitToggleItem: (id: number) => void | Promise<void>;
  toggleExpand: (id: number) => void;
  isExpanded: (id: number) => boolean;
};

function ChecklistLayoutItemRowInner({
  item,
  rowKind,
  globalIndex,
  checkedById,
  activeItemId,
  roadmapTab,
  getItemToggleEligibility,
  onToggleItem,
  commitToggleItem,
  toggleExpand,
  isExpanded,
}: ChecklistLayoutItemRowProps) {
  const submitRegistry = useChecklistStepSubmitRegistry();
  const rowChecked = !!checkedById[item.id];
  const { canCheck, canUncheck, canMarkChecked } = getItemToggleEligibility(roadmapTab, item.id);
  const checkboxDisabled = (!rowChecked && !canCheck) || (rowChecked && !canUncheck);

  const isActive = activeItemId != null && item.id === activeItemId;
  const shouldShowIntegration = (item as { component_key?: string }).component_key != null;
  const expanded = isExpanded(item.id);
  const isCurrentRow = rowKind === "current";
  const showDetails = isCurrentRow ? true : expanded;
  const showIntegrationBlock = shouldShowIntegration && (isCurrentRow || expanded);

  const checklistItem: ChecklistCloseLayoutCheckboxItem = {
    id: item.id,
    label: item.label,
    explanation: item.explanation,
    bullets: item.bullets ?? undefined,
    tip: item.tip ?? undefined,
    resource: item.resource ?? undefined,
    optional: item.optional ?? undefined,
  };

  const hasHeaderSubmit = Boolean(submitRegistry?.registration);

  return (
    <Box
      className={`w-full rounded-lg px-3 py-2 ${DOTTED_BORDER_LIGHT_GRAY} ${
        isActive
          ? "ring-gold relative z-10 overflow-visible shadow-[0_0_3px_rgba(181,168,138,0.6),0_0_10px_rgba(181,168,138,0.35),0_0_20px_rgba(181,168,138,0.15)] ring-1"
          : ""
      }`}
    >
      <Box className="flex flex-row items-start gap-2">
        <Box className="min-w-0 flex-1">
          <ChecklistCheckbox
            item={checklistItem}
            checked={rowChecked}
            onToggle={() => onToggleItem(item.id)}
            itemLabelClass={itemLabel}
            itemExplanationClass={itemExplanation}
            checkboxContainerClass={checkboxContainer}
            number={globalIndex + 1}
            showDetails={showDetails}
            disabled={checkboxDisabled}
          />
        </Box>
        <Box className="mt-0.5 flex flex-shrink-0 flex-row items-center gap-1">
          <ChecklistStepHeaderSubmitButton integrationVisible={showIntegrationBlock} />
          {isCurrentRow ? (
            hasHeaderSubmit ? null : <Box className="h-6 w-6 flex-shrink-0" aria-hidden />
          ) : (
            <IconButton
              variant="ghost"
              size="sm"
              iconName={expanded ? "chevron-down" : "chevron-right"}
              label={expanded ? "Collapse step" : "Expand step"}
              onPress={() => toggleExpand(item.id)}
              className="text-text-secondary hover:text-text-primary flex h-6 w-6 flex-shrink-0"
            />
          )}
        </Box>
      </Box>
      {showIntegrationBlock ? (
        <ChecklistIntegrationSlot
          componentKey={(item as { component_key?: string }).component_key}
          isCurrent={true}
          onComplete={() => {
            if (canMarkChecked) void commitToggleItem(item.id);
          }}
        />
      ) : null}
    </Box>
  );
}

export function ChecklistLayoutItemRow(props: ChecklistLayoutItemRowProps) {
  return (
    <ChecklistStepSubmitProvider>
      <ChecklistLayoutItemRowInner {...props} />
    </ChecklistStepSubmitProvider>
  );
}
