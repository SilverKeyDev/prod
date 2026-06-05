import { useCallback, useEffect, useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import { useResolvedTransactionId } from "packages/features/checklists/hooks/data/useResolvedTransactionId";
import { useAutoCompleteChecklistIntegrations } from "packages/features/checklists/hooks/useAutoCompleteChecklistIntegrations";
import { useChecklistProgress } from "packages/features/checklists/hooks/useChecklistProgress";
import { useChecklistStepExpansion } from "packages/features/checklists/hooks/useChecklistStepExpansion";
import { useChecklistStepSigningFooter } from "packages/features/checklists/hooks/useChecklistStepSigningFooter";
import type {
  ChecklistLayoutDisclosureState,
  CloseLayoutProps,
} from "packages/features/checklists/types/checklistCloseLayout";
import {
  buildProgressiveChecklistRows,
  DEFAULT_CHECKLIST_PREVIEW_UPCOMING,
  getHiddenFutureItemCount,
  shouldUseProgressiveDisclosure,
} from "packages/features/checklists/utils/progressive/buildProgressiveChecklistRows";
import {
  CHECKLIST_TYPE_TO_TAB,
  parseChecklistTypeFromApiEndpoint,
} from "packages/features/checklists/utils/rules/checklistTypeTab";
import { sortTaskChecklistItems } from "packages/features/checklists/utils/sort/sortTaskChecklistItems";
import { sortTaskChecklistItemsForDisplay } from "packages/features/checklists/utils/sort/sortTaskChecklistItemsForDisplay";
import { showErrorToast } from "packages/hooks/ui";
import { log } from "packages/logger";

const defaultDisclosure: ChecklistLayoutDisclosureState = {
  futureOpen: false,
  completedOpen: false,
};

export type UseChecklistLayoutControllerParams = Pick<
  CloseLayoutProps,
  | "checklistType"
  | "apiEndpoint"
  | "transactionId"
  | "setClosePageHeaderData"
  | "title"
  | "subtitle"
>;

export function useChecklistLayoutController({
  checklistType: checklistTypeProp,
  apiEndpoint,
  transactionId: transactionIdProp,
  setClosePageHeaderData,
  title,
  subtitle,
}: UseChecklistLayoutControllerParams) {
  const { t } = useLocalization();
  const checklistType = useMemo(() => {
    if (checklistTypeProp) {
      return checklistTypeProp;
    }
    if (apiEndpoint) {
      return parseChecklistTypeFromApiEndpoint(apiEndpoint);
    }
    return "search" as const;
  }, [checklistTypeProp, apiEndpoint]);
  const roadmapTab = CHECKLIST_TYPE_TO_TAB[checklistType];

  const { transactionId: resolvedTransactionId, isLoading: transactionIdLoading } =
    useResolvedTransactionId();
  const effectiveTransactionId = transactionIdProp ?? resolvedTransactionId;
  const waitForResolvedTransaction = transactionIdProp == null;

  const {
    items,
    checkedIds,
    activeItemId,
    activeItemIds,
    isLoading: loading,
    isChecklistUpdatePending,
    toggleItem,
    getItemToggleEligibility,
  } = useChecklistProgress({
    transactionId: effectiveTransactionId ?? undefined,
    enabled: !waitForResolvedTransaction || !transactionIdLoading,
    activeSection: roadmapTab,
  });

  const templateSortedItems = useMemo(() => sortTaskChecklistItems(items), [items]);
  const displaySortedItems = useMemo(
    () => sortTaskChecklistItemsForDisplay(templateSortedItems, checkedIds),
    [templateSortedItems, checkedIds]
  );

  useAutoCompleteChecklistIntegrations({
    items,
    checkedIds,
    toggleItem,
    getItemToggleEligibility,
    roadmapTab,
    isChecklistUpdatePending,
    isChecklistLoading: loading,
  });

  const {
    renderSigningFooter,
    agreementSigningSession,
    dismissAgreementSigning,
    onAgreementSigningComplete,
  } = useChecklistStepSigningFooter({
    checklistType,
    activeItemIds,
    isAgent: false,
  });

  const checkedById = useMemo(() => {
    const mapping: { [id: number]: boolean } = {};
    checkedIds.forEach((id: number) => {
      mapping[id] = true;
    });
    return mapping;
  }, [checkedIds]);

  const toggle = useCallback(
    async (id: number) => {
      const rowChecked = checkedIds.includes(id);
      const { canUncheck, canMarkChecked } = getItemToggleEligibility(roadmapTab, id);
      if (rowChecked && !canUncheck) return;
      if (!rowChecked && !canMarkChecked) return;
      try {
        await toggleItem(id);
      } catch (error: unknown) {
        log.error("ERRORS", "Failed to update checklist item", error);
        showErrorToast(
          t("checklists.update_error", {
            defaultValue: "Could not update this step. Please try again.",
          })
        );
      }
    },
    [checkedIds, getItemToggleEligibility, roadmapTab, t, toggleItem]
  );

  const { toggleExpand, isExpanded } = useChecklistStepExpansion(activeItemIds);

  const [disclosureByType, setDisclosureByType] = useState<
    Partial<Record<string, ChecklistLayoutDisclosureState>>
  >({});

  const disclosure = disclosureByType[checklistType] ?? defaultDisclosure;

  const setTypeDisclosure = useCallback(
    (patch: Partial<ChecklistLayoutDisclosureState>) => {
      setDisclosureByType((prev) => ({
        ...prev,
        [checklistType]: {
          ...(prev[checklistType] ?? defaultDisclosure),
          ...patch,
        },
      }));
    },
    [checklistType]
  );

  const segments = useMemo(
    () =>
      buildProgressiveChecklistRows(displaySortedItems, activeItemId, {
        previewUpcoming: DEFAULT_CHECKLIST_PREVIEW_UPCOMING,
        futureOpen: disclosure.futureOpen,
        completedOpen: disclosure.completedOpen,
        revealedCompletedItemId: null,
      }),
    [displaySortedItems, activeItemId, disclosure.futureOpen, disclosure.completedOpen]
  );

  const futureHidden = getHiddenFutureItemCount(
    displaySortedItems,
    activeItemId,
    DEFAULT_CHECKLIST_PREVIEW_UPCOMING
  );
  const useProgressive = shouldUseProgressiveDisclosure(displaySortedItems.length);

  useEffect(() => {
    if (setClosePageHeaderData) {
      const completedCountHeader = Object.values(checkedById).filter(Boolean).length;
      const totalCount = items.length;
      setClosePageHeaderData({
        title,
        subtitle,
        completedCount: completedCountHeader,
        totalCount,
        loading,
      });
    }
  }, [checkedById, loading, title, subtitle, items.length, setClosePageHeaderData]);

  useEffect(() => {
    return () => {
      if (setClosePageHeaderData) {
        setClosePageHeaderData(null);
      }
    };
  }, [setClosePageHeaderData]);

  return {
    checklistType,
    roadmapTab,
    effectiveTransactionId,
    items,
    checkedIds,
    activeItemIds,
    loading,
    isChecklistUpdatePending,
    displaySortedItems,
    checkedById,
    toggle,
    toggleItem,
    toggleExpand,
    isExpanded,
    getItemToggleEligibility,
    disclosure,
    setTypeDisclosure,
    segments,
    futureHidden,
    useProgressive,
    renderSigningFooter,
    agreementSigningSession,
    dismissAgreementSigning,
    onAgreementSigningComplete,
  };
}
