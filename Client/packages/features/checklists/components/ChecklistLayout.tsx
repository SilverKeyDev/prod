import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import {
  type ChecklistType,
  useChecklistData,
} from "packages/features/checklists/hooks/data/useChecklistData";
import { useChecklistProgress } from "packages/features/checklists/hooks/useChecklistProgress";
import { useChecklistStepExpansion } from "packages/features/checklists/hooks/useChecklistStepExpansion";
import type {
  ChecklistLayoutDisclosureState,
  CloseLayoutProps,
} from "packages/features/checklists/types/checklistCloseLayout";
import {
  buildProgressiveChecklistRows,
  DEFAULT_CHECKLIST_PREVIEW_UPCOMING,
  getChecklistActiveIndex,
  getHiddenFutureItemCount,
  shouldUseProgressiveDisclosure,
} from "packages/features/checklists/utils/progressive/buildProgressiveChecklistRows";
import {
  CHECKLIST_TYPE_TO_TAB,
  parseChecklistTypeFromApiEndpoint,
} from "packages/features/checklists/utils/rules/checklistTypeTab";
import { sortTaskChecklistItems } from "packages/features/checklists/utils/sort/sortTaskChecklistItems";
import Card from "packages/ui/components/cards/Card";
import { Box, Pressable, Text } from "packages/ui/components/primitives";
import { DOTTED_BORDER_LIGHT_GRAY } from "packages/ui/components/primitives/divider/dividerStyles";

import { BodyText } from "@/components/ui";

import { ChecklistLayoutItemRow } from "./ChecklistLayoutItemRow";

const sectionTitle =
  "text-responsive-sm font-semibold text-text-primary flex flex-row items-center gap-responsive-xs";

const defaultDisclosure: ChecklistLayoutDisclosureState = {
  completedOpen: false,
  futureOpen: false,
};

export default function CloseLayout({
  title,
  subtitle,
  sectionTitle: sectionTitleText,
  apiEndpoint,
  children,
  showLoadingScreen = false,
  containerClassName = "py-0",
  showMinLoadingText = false,
  setClosePageHeaderData,
}: CloseLayoutProps) {
  const { t } = useLocalization();
  const checklistType = useMemo(
    () => parseChecklistTypeFromApiEndpoint(apiEndpoint),
    [apiEndpoint]
  );

  const {
    items,
    checkedIds,
    activeItemId,
    isLoading: loading,
    toggleItem,
  } = useChecklistData(checklistType);
  const { getItemToggleEligibility } = useChecklistProgress();
  const roadmapTab = CHECKLIST_TYPE_TO_TAB[checklistType];

  const sortedItems = useMemo(() => sortTaskChecklistItems(items), [items]);

  const checkedById = React.useMemo(() => {
    const mapping: { [id: number]: boolean } = {};
    checkedIds.forEach((id: number) => {
      mapping[id] = true;
    });
    return mapping;
  }, [checkedIds]);

  const toggle = (id: number) => {
    const rowChecked = checkedIds.includes(id);
    const { canUncheck, canMarkChecked } = getItemToggleEligibility(roadmapTab, id);
    if (rowChecked && !canUncheck) return;
    if (!rowChecked && !canMarkChecked) return;
    void toggleItem(id);
  };

  const { toggleExpand, isExpanded } = useChecklistStepExpansion(activeItemId, checkedIds);

  const [disclosureByType, setDisclosureByType] = useState<
    Partial<Record<ChecklistType, ChecklistLayoutDisclosureState>>
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

  const prevActiveIdRef = useRef<number | null | undefined>(undefined);
  useEffect(() => {
    if (prevActiveIdRef.current === undefined) {
      prevActiveIdRef.current = activeItemId;
      return;
    }
    const prevIdx = getChecklistActiveIndex(sortedItems, prevActiveIdRef.current as number | null);
    const nextIdx = getChecklistActiveIndex(sortedItems, activeItemId);
    if (nextIdx > prevIdx) {
      setDisclosureByType((prev) => ({
        ...prev,
        [checklistType]: {
          ...(prev[checklistType] ?? defaultDisclosure),
          completedOpen: false,
        },
      }));
    }
    prevActiveIdRef.current = activeItemId;
  }, [activeItemId, sortedItems, checklistType]);

  const segments = useMemo(
    () =>
      buildProgressiveChecklistRows(sortedItems, activeItemId, {
        previewUpcoming: DEFAULT_CHECKLIST_PREVIEW_UPCOMING,
        completedOpen: disclosure.completedOpen,
        futureOpen: disclosure.futureOpen,
      }),
    [sortedItems, activeItemId, disclosure.completedOpen, disclosure.futureOpen]
  );

  const activeIndex = getChecklistActiveIndex(sortedItems, activeItemId);
  const completedCount = activeIndex;
  const futureHidden = getHiddenFutureItemCount(
    sortedItems,
    activeItemId,
    DEFAULT_CHECKLIST_PREVIEW_UPCOMING
  );
  const useProgressive = shouldUseProgressiveDisclosure(sortedItems.length);

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

  if (showLoadingScreen && loading && checkedIds.length === 0) {
    return (
      <Box className="bg-background-base text-text-primary flex flex-row items-center justify-center">
        <BodyText as="p" size="sm">
          Loading checklist…
        </BodyText>
      </Box>
    );
  }

  return (
    <Box className="bg-background-base">
      {children && <Box className="mb-responsive-sm">{children}</Box>}

      <Box className={containerClassName}>
        {loading && showMinLoadingText && (
          <BodyText size="sm" className="mb-responsive-sm">
            Loading checklist…
          </BodyText>
        )}

        <Box className="w-full max-w-none self-center">
          <Card border="light" className="mb-responsive-md" padding="sm">
            <Box className={sectionTitle}>
              <Box className="flex h-4 w-4 flex-shrink-0 flex-row items-center justify-center lg:h-5 lg:w-5">
                <Icon name="check-square" className="text-foreground h-4 w-4 lg:h-5 lg:w-5" />
              </Box>
              {sectionTitleText}
            </Box>

            <Box className="mt-responsive-xs text-left">
              <Text className="sr-only">Checklist</Text>
              <Box className="flex flex-col gap-2 overflow-visible">
                {useProgressive && disclosure.completedOpen && completedCount > 0 ? (
                  <Pressable
                    onPress={() => setTypeDisclosure({ completedOpen: false })}
                    className={`flex flex-row items-center gap-2 rounded-lg px-3 py-2 ${DOTTED_BORDER_LIGHT_GRAY}`}
                    accessibilityRole="button"
                    aria-expanded
                  >
                    <Icon name="chevron-down" className="text-text-secondary h-4 w-4 shrink-0" />
                    <Text className="text-text-primary text-sm font-medium">
                      {t("checklists.progressive.completed_expanded", {
                        count: completedCount,
                      })}
                    </Text>
                  </Pressable>
                ) : null}
                {useProgressive
                  ? segments.map((segment, segIdx) => {
                      if (segment.kind === "completed_collapsed") {
                        return (
                          <Pressable
                            key={`cc-${segIdx}`}
                            onPress={() => setTypeDisclosure({ completedOpen: true })}
                            className={`flex flex-row items-center gap-2 rounded-lg px-3 py-2 ${DOTTED_BORDER_LIGHT_GRAY}`}
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
                      if (segment.kind === "future_collapsed") {
                        return (
                          <Pressable
                            key={`fc-${segIdx}`}
                            onPress={() => setTypeDisclosure({ futureOpen: true })}
                            className={`flex flex-row items-center gap-2 rounded-lg px-3 py-2 ${DOTTED_BORDER_LIGHT_GRAY}`}
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
                          <ChecklistLayoutItemRow
                            key={`${segment.kind}-${segment.item.id}`}
                            item={segment.item}
                            rowKind={segment.kind}
                            globalIndex={segment.globalIndex}
                            checkedById={checkedById}
                            activeItemId={activeItemId}
                            roadmapTab={roadmapTab}
                            getItemToggleEligibility={getItemToggleEligibility}
                            onToggleItem={toggle}
                            commitToggleItem={toggleItem}
                            toggleExpand={toggleExpand}
                            isExpanded={isExpanded}
                          />
                        );
                      }
                      return null;
                    })
                  : sortedItems.map((item, index) => (
                      <ChecklistLayoutItemRow
                        key={`flat_item-${item.id}`}
                        item={item}
                        rowKind="flat_item"
                        globalIndex={index}
                        checkedById={checkedById}
                        activeItemId={activeItemId}
                        roadmapTab={roadmapTab}
                        getItemToggleEligibility={getItemToggleEligibility}
                        onToggleItem={toggle}
                        commitToggleItem={toggleItem}
                        toggleExpand={toggleExpand}
                        isExpanded={isExpanded}
                      />
                    ))}
                {useProgressive && disclosure.futureOpen && futureHidden > 0 ? (
                  <Pressable
                    onPress={() => setTypeDisclosure({ futureOpen: false })}
                    className={`flex flex-row items-center gap-2 rounded-lg px-3 py-2 ${DOTTED_BORDER_LIGHT_GRAY}`}
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
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
