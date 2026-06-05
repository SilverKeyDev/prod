import React, { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { ChecklistType, TaskChecklistItem } from "packages/features/checklists/api/checklists";
import { ChecklistUpdatePendingProvider } from "packages/features/checklists/components/roadmap/ChecklistUpdatePendingProvider";
import ChecklistDispatchAutomationModal from "packages/features/checklists/components/slots/ChecklistDispatchAutomationModal";
import { useChecklistStepExpansion } from "packages/features/checklists/hooks/useChecklistStepExpansion";
import type { ChecklistTab } from "packages/features/checklists/types/checklists";
import {
  buildProgressiveChecklistRows,
  DEFAULT_CHECKLIST_PREVIEW_UPCOMING,
  getChecklistActiveIndex,
  getHiddenFutureItemCount,
} from "packages/features/checklists/utils/progressive/buildProgressiveChecklistRows";
import {
  type ChecklistItemToggleEligibility,
  getRoadmapChecklistItemBlockerKind,
} from "packages/features/checklists/utils/rules/checklistRules";
import { sortTaskChecklistItemsForDisplay } from "packages/features/checklists/utils/sort/sortTaskChecklistItemsForDisplay";
import { Loading } from "packages/ui/components/media/asset/loading/Loading";
import { Box, Pressable, Text } from "packages/ui/components/structure/primitives";
import Card from "packages/ui/components/surfaces/cards/Card";

import { BuyerRoadmapChecklistItemCard } from "./BuyerRoadmapChecklistItemCard";

export type BuyerRoadmapChecklistListProps = {
  currentTab: ChecklistTab;
  sortedItems: TaskChecklistItem[];
  checkedIds: number[];
  activeItemId: number | null;
  /** Highlight/expand all ids in a parallel group (see `parallel_step_group` on items). */
  activeItemIds: readonly number[];
  isSectionLocked: boolean;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void | Promise<void>;
  onToggleItem: (id: number) => void | Promise<void>;
  /**
   * Raw checklist write for integration submit completion (parity with CloseLayout
   * `commitToggleItem`). Pass `toggleItem` from `useChecklistData` so the step checks off
   * after save; when omitted, {@link onToggleItem} is used.
   */
  commitToggleItem?: (id: number) => void | Promise<void>;
  getItemToggleEligibility: (
    section: ChecklistTab,
    itemId: number
  ) => ChecklistItemToggleEligibility;
  /** When true, checklist integration UIs are not rendered. */
  hideIntegrationComponents?: boolean;
  /** When true, disables checklist submit buttons while a checklist PUT is in flight. */
  isChecklistUpdatePending?: boolean;
  /** Rendered inside the outer card above the list (e.g. section subtitle). */
  subtitle?: ReactNode;
  /**
   * Agent-only footer below the row (e.g. forms). Called for each item; return null to skip.
   * Typically gated on active item in the parent.
   */
  renderItemAgentFooter?: (
    item: TaskChecklistItem,
    ctx: ChecklistItemToggleEligibility
  ) => ReactNode;
  /**
   * Footer for all users below the row (e.g. signing cards via TodoAgendaRow).
   * Called for each item; return null to skip.
   */
  renderItemFooter?: (item: TaskChecklistItem) => ReactNode;
  /** When set with checklistCategory, agents see automation settings on eligible steps. */
  hubClientUserId?: string | null;
  checklistCategory?: ChecklistType | null;
  isAgent?: boolean;
  /** Buyer roadmap: phase completion for section-gate copy and navigation. */
  sectionProgress: Record<ChecklistTab, { isComplete: boolean }>;
  /** Navigates roadmap phase tabs (e.g. Search → Offer) when a section or row is gated. */
  onRoadmapTabNavigate?: (tab: ChecklistTab) => void;
  /** Transaction subject for rev-share placement and integration context. */
  transactionId?: string | null;
};

type TabDisclosure = { futureOpen: boolean; completedOpen: boolean };

const defaultTabDisclosure: TabDisclosure = {
  futureOpen: false,
  completedOpen: false,
};

export function BuyerRoadmapChecklistList({
  currentTab,
  sortedItems,
  checkedIds,
  activeItemId,
  activeItemIds,
  isSectionLocked,
  isLoading,
  error,
  onRefresh,
  onToggleItem,
  commitToggleItem: commitToggleItemProp,
  getItemToggleEligibility,
  hideIntegrationComponents = false,
  subtitle,
  renderItemAgentFooter,
  renderItemFooter,
  hubClientUserId = null,
  checklistCategory = null,
  isAgent = false,
  sectionProgress,
  onRoadmapTabNavigate,
  isChecklistUpdatePending = false,
  transactionId,
}: BuyerRoadmapChecklistListProps) {
  const { t } = useLocalization();
  const [dispatchModalItemId, setDispatchModalItemId] = useState<number | null>(null);
  const { toggleExpand, isExpanded } = useChecklistStepExpansion(activeItemIds, {
    expandFirstActiveOnly: true,
  });

  const [disclosureByTab, setDisclosureByTab] = useState<
    Partial<Record<ChecklistTab, TabDisclosure>>
  >({});

  const [revealedCompletedItemId, setRevealedCompletedItemId] = useState<number | null>(null);

  const disclosure = disclosureByTab[currentTab] ?? defaultTabDisclosure;

  const displaySortedItems = useMemo(
    () => sortTaskChecklistItemsForDisplay(sortedItems, checkedIds),
    [sortedItems, checkedIds]
  );

  const setTabDisclosure = useCallback(
    (patch: Partial<TabDisclosure>) => {
      setDisclosureByTab((prev) => ({
        ...prev,
        [currentTab]: { ...(prev[currentTab] ?? defaultTabDisclosure), ...patch },
      }));
    },
    [currentTab]
  );

  useEffect(() => {
    setRevealedCompletedItemId(null);
  }, [currentTab]);

  useEffect(() => {
    if (revealedCompletedItemId == null) return;
    const activeIndex = getChecklistActiveIndex(displaySortedItems, activeItemId);
    const inCompletedPrefix = displaySortedItems
      .slice(0, activeIndex)
      .some((i) => i.id === revealedCompletedItemId);
    if (!inCompletedPrefix) {
      setRevealedCompletedItemId(null);
    }
  }, [activeItemId, displaySortedItems, revealedCompletedItemId]);

  const segments = useMemo(
    () =>
      buildProgressiveChecklistRows(displaySortedItems, activeItemId, {
        previewUpcoming: DEFAULT_CHECKLIST_PREVIEW_UPCOMING,
        futureOpen: disclosure.futureOpen,
        completedOpen: disclosure.completedOpen,
        revealedCompletedItemId,
        useProgressiveStructure: true,
      }),
    [
      displaySortedItems,
      activeItemId,
      disclosure.futureOpen,
      disclosure.completedOpen,
      revealedCompletedItemId,
    ]
  );

  const futureHidden = getHiddenFutureItemCount(
    displaySortedItems,
    activeItemId,
    DEFAULT_CHECKLIST_PREVIEW_UPCOMING
  );

  const itemCount = displaySortedItems.length;

  const getRoadmapItemBlocker = useCallback(
    (itemId: number) =>
      getRoadmapChecklistItemBlockerKind(sortedItems, checkedIds, itemId, !isSectionLocked, {
        isAgentViewer: isAgent === true,
      }),
    [sortedItems, checkedIds, isSectionLocked, isAgent]
  );

  const revealRoadmapItem = useCallback(
    (itemId: number) => {
      const activeIndex = getChecklistActiveIndex(displaySortedItems, activeItemId);
      const idx = displaySortedItems.findIndex((i) => i.id === itemId);
      if (idx < 0) return;
      if (idx < activeIndex) {
        setRevealedCompletedItemId(itemId);
      }
      const preview = DEFAULT_CHECKLIST_PREVIEW_UPCOMING;
      const firstHiddenFutureIndex = activeIndex + 1 + preview;
      if (idx >= firstHiddenFutureIndex && futureHidden > 0 && !disclosure.futureOpen) {
        setTabDisclosure({ futureOpen: true });
      }
      toggleExpand(itemId);
    },
    [
      displaySortedItems,
      activeItemId,
      disclosure.futureOpen,
      futureHidden,
      setTabDisclosure,
      toggleExpand,
    ]
  );

  const commitToggleItem = commitToggleItemProp ?? onToggleItem;

  const cardProps = {
    currentTab,
    checkedIds,
    activeItemIds,
    isSectionLocked,
    hideIntegrationComponents,
    getItemToggleEligibility,
    onToggleItem,
    commitToggleItem,
    isExpanded,
    toggleExpand,
    hubClientUserId,
    checklistCategory,
    isAgent,
    onOpenDispatchModal: setDispatchModalItemId,
    renderItemAgentFooter,
    renderItemFooter,
    getRoadmapItemBlocker,
    sectionProgress,
    onRoadmapTabNavigate,
    onRevealRoadmapItem: revealRoadmapItem,
    isChecklistUpdatePending,
    transactionId,
  };

  return (
    <ChecklistUpdatePendingProvider value={isChecklistUpdatePending}>
      <>
        <Card border="light" className="bg-background-base" padding="md" hover={false}>
          {subtitle != null ? subtitle : null}
          {isLoading ? (
            <Box className="flex flex-row items-center justify-center py-12">
              <Loading />
            </Box>
          ) : error ? (
            <Box className="flex flex-col gap-3">
              <Text className="text-sm text-red-500">{error}</Text>
              <Pressable
                onPress={() => {
                  void onRefresh();
                }}
                className="bg-primary self-start rounded-lg px-4 py-2"
              >
                <Text className="text-sm font-medium text-white">Retry</Text>
              </Pressable>
            </Box>
          ) : itemCount === 0 ? (
            <Box className="flex flex-row items-center justify-center py-12">
              <Text className="text-text-tertiary text-base">No checklist items yet.</Text>
            </Box>
          ) : (
            <Box className="flex flex-col gap-2">
              {segments.map((segment, segIdx) => {
                if (segment.kind === "completed_collapsed") {
                  return (
                    <Pressable
                      key={`cc-${segIdx}`}
                      onPress={() => setTabDisclosure({ completedOpen: true })}
                      className="border-border bg-background-base m-1.5 flex flex-row items-center gap-2 rounded-lg border px-4 py-3"
                      aria-expanded={false}
                    >
                      <Icon name="chevron-right" className="text-text-secondary h-4 w-4 shrink-0" />
                      <Text className="text-text-primary text-sm font-medium">
                        {t("checklists.progressive.completed_collapsed", {
                          count: segment.count,
                        })}
                      </Text>
                    </Pressable>
                  );
                }
                if (segment.kind === "completed_expanded_header") {
                  return (
                    <Pressable
                      key={`ceh-${segIdx}`}
                      onPress={() => setTabDisclosure({ completedOpen: false })}
                      className="border-border bg-background-base m-1.5 flex flex-row items-center gap-2 rounded-lg border px-4 py-3"
                      aria-expanded
                    >
                      <Icon name="chevron-down" className="text-text-secondary h-4 w-4 shrink-0" />
                      <Text className="text-text-primary text-sm font-medium">
                        {t("checklists.progressive.completed_collapsed", {
                          count: segment.count,
                        })}
                      </Text>
                    </Pressable>
                  );
                }
                if (segment.kind === "future_collapsed") {
                  return (
                    <Pressable
                      key={`fc-${segIdx}`}
                      onPress={() => setTabDisclosure({ futureOpen: true })}
                      className="border-border bg-background-base m-1.5 flex flex-row items-center gap-2 rounded-lg border px-4 py-3"
                      aria-expanded={false}
                    >
                      <Icon name="chevron-right" className="text-text-secondary h-4 w-4 shrink-0" />
                      <Text className="text-text-secondary text-sm font-medium">
                        {t("checklists.progressive.show_more_collapsed", {
                          count: segment.count,
                        })}
                      </Text>
                    </Pressable>
                  );
                }
                if (
                  segment.kind === "completed_item" ||
                  segment.kind === "current" ||
                  segment.kind === "upcoming" ||
                  segment.kind === "future_item"
                ) {
                  return (
                    <BuyerRoadmapChecklistItemCard
                      key={`${segment.kind}-${segment.item.id}`}
                      {...cardProps}
                      item={segment.item}
                      rowKind={segment.kind}
                    />
                  );
                }
                return null;
              })}
              {disclosure.futureOpen && futureHidden > 0 ? (
                <Pressable
                  onPress={() => setTabDisclosure({ futureOpen: false })}
                  className="border-border bg-background-base m-1.5 flex flex-row items-center gap-2 rounded-lg border px-4 py-3"
                  aria-expanded
                >
                  <Icon name="chevron-down" className="text-text-secondary h-4 w-4 shrink-0" />
                  <Text className="text-text-secondary text-sm font-medium">
                    {t("checklists.progressive.show_more_expanded")}
                  </Text>
                </Pressable>
              ) : null}
            </Box>
          )}
        </Card>
        {hubClientUserId && checklistCategory && dispatchModalItemId != null ? (
          <ChecklistDispatchAutomationModal
            isOpen={true}
            onClose={() => setDispatchModalItemId(null)}
            hubClientUserId={hubClientUserId}
            checklistCategory={checklistCategory}
            itemId={dispatchModalItemId}
            itemLabel={sortedItems.find((i) => i.id === dispatchModalItemId)?.label ?? ""}
          />
        ) : null}
      </>
    </ChecklistUpdatePendingProvider>
  );
}
