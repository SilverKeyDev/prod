import React, { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { ChecklistType, TaskChecklistItem } from "packages/features/checklists/api/checklists";
import ChecklistDispatchAutomationModal from "packages/features/checklists/components/ChecklistDispatchAutomationModal";
import { useChecklistStepExpansion } from "packages/features/checklists/hooks/useChecklistStepExpansion";
import { CHECKLIST_TITLES, type ChecklistTab } from "packages/features/checklists/types/checklists";
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
import { getFirstIncompleteUnlockSection } from "packages/features/checklists/utils/rules/sectionConfig";
import { Loading } from "packages/ui/components/asset/loading/Loading";
import Card from "packages/ui/components/cards/Card";
import { Box, Pressable, Text } from "packages/ui/components/primitives";

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
  getItemToggleEligibility: (
    section: ChecklistTab,
    itemId: number
  ) => ChecklistItemToggleEligibility;
  /** When true, checklist integration UIs are not rendered. */
  hideIntegrationComponents?: boolean;
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
}: BuyerRoadmapChecklistListProps) {
  const { t } = useLocalization();
  const [dispatchModalItemId, setDispatchModalItemId] = useState<number | null>(null);
  const { toggleExpand, isExpanded } = useChecklistStepExpansion(activeItemIds, checkedIds);

  const [disclosureByTab, setDisclosureByTab] = useState<
    Partial<Record<ChecklistTab, TabDisclosure>>
  >({});

  const [revealedCompletedItemId, setRevealedCompletedItemId] = useState<number | null>(null);

  const disclosure = disclosureByTab[currentTab] ?? defaultTabDisclosure;

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
    const activeIndex = getChecklistActiveIndex(sortedItems, activeItemId);
    const inCompletedPrefix = sortedItems
      .slice(0, activeIndex)
      .some((i) => i.id === revealedCompletedItemId);
    if (!inCompletedPrefix) {
      setRevealedCompletedItemId(null);
    }
  }, [activeItemId, sortedItems, revealedCompletedItemId]);

  const segments = useMemo(
    () =>
      buildProgressiveChecklistRows(sortedItems, activeItemId, {
        previewUpcoming: DEFAULT_CHECKLIST_PREVIEW_UPCOMING,
        futureOpen: disclosure.futureOpen,
        completedOpen: disclosure.completedOpen,
        revealedCompletedItemId,
        useProgressiveStructure: true,
      }),
    [sortedItems, activeItemId, disclosure.futureOpen, disclosure.completedOpen, revealedCompletedItemId]
  );

  const futureHidden = getHiddenFutureItemCount(
    sortedItems,
    activeItemId,
    DEFAULT_CHECKLIST_PREVIEW_UPCOMING
  );

  const itemCount = sortedItems.length;

  const getRoadmapItemBlocker = useCallback(
    (itemId: number) =>
      getRoadmapChecklistItemBlockerKind(sortedItems, checkedIds, itemId, !isSectionLocked),
    [sortedItems, checkedIds, isSectionLocked]
  );

  const revealRoadmapItem = useCallback(
    (itemId: number) => {
      const activeIndex = getChecklistActiveIndex(sortedItems, activeItemId);
      const idx = sortedItems.findIndex((i) => i.id === itemId);
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
    [sortedItems, activeItemId, disclosure.futureOpen, futureHidden, setTabDisclosure, toggleExpand]
  );

  const sectionGateTarget = useMemo(
    () => getFirstIncompleteUnlockSection(currentTab, sectionProgress),
    [currentTab, sectionProgress]
  );

  const cardProps = {
    currentTab,
    checkedIds,
    activeItemIds,
    isSectionLocked,
    hideIntegrationComponents,
    getItemToggleEligibility,
    onToggleItem,
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
  };

  return (
    <>
      <Card border="light" className="bg-background-base" padding="md" hover={false}>
        {subtitle != null ? subtitle : null}
        {isLoading ? (
          <Box className="flex flex-row items-center justify-center py-12">
            <Loading />
          </Box>
        ) : error ? (
          <Box className="flex flex-row flex-col gap-3">
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
            <Text className="text-warm-stone text-base">No checklist items yet.</Text>
          </Box>
        ) : (
          <Box className="flex flex-row flex-col gap-2">
            {isSectionLocked ? (
              <Pressable
                onPress={() => {
                  if (sectionGateTarget != null) onRoadmapTabNavigate?.(sectionGateTarget);
                }}
                label={
                  sectionGateTarget != null
                    ? t("checklists.roadmap.section_banner", {
                        phase: CHECKLIST_TITLES[sectionGateTarget],
                      })
                    : t("checklists.roadmap.finish_previous_phases")
                }
                className="border-border bg-background-base mt-2 flex flex-row items-center gap-2 rounded-lg border px-4 py-3 active:opacity-90"
              >
                <Icon name="info" className="text-gold h-4 w-4 shrink-0 opacity-90" />
                <Text className="text-text-primary flex-1 text-sm font-medium">
                  {sectionGateTarget != null
                    ? t("checklists.roadmap.section_banner", {
                        phase: CHECKLIST_TITLES[sectionGateTarget],
                      })
                    : t("checklists.roadmap.finish_previous_phases")}
                </Text>
                <Icon name="chevron-right" className="text-gold h-4 w-4 shrink-0 opacity-90" />
              </Pressable>
            ) : null}
            {segments.map((segment, segIdx) => {
                  if (segment.kind === "completed_collapsed") {
                    return (
                      <Pressable
                        key={`cc-${segIdx}`}
                        onPress={() => setTabDisclosure({ completedOpen: true })}
                        className="border-border bg-background-base m-1.5 flex flex-row items-center gap-2 rounded-lg border px-4 py-3"
                        accessibilityRole="button"
                        aria-expanded={false}
                      >
                        <Icon
                          name="chevron-right"
                          className="text-text-secondary h-4 w-4 shrink-0"
                        />
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
                        accessibilityRole="button"
                        aria-expanded
                      >
                        <Icon
                          name="chevron-down"
                          className="text-text-secondary h-4 w-4 shrink-0"
                        />
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
                        accessibilityRole="button"
                        aria-expanded={false}
                      >
                        <Icon
                          name="chevron-right"
                          className="text-text-secondary h-4 w-4 shrink-0"
                        />
                        <Text className="text-text-primary text-sm font-medium">
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
                accessibilityRole="button"
                aria-expanded
              >
                <Icon name="chevron-down" className="text-text-secondary h-4 w-4 shrink-0" />
                <Text className="text-text-primary text-sm font-medium">
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
  );
}
