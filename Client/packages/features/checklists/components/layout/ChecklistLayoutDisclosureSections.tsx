import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";
import { ChecklistLayoutItemRow } from "packages/features/checklists/components/layout/ChecklistLayoutItemRow";
import type { ChecklistLayoutDisclosureState } from "packages/features/checklists/types/checklistCloseLayout";
import type { ChecklistTab } from "packages/features/checklists/types/checklists";
import type { ProgressiveChecklistSegment } from "packages/features/checklists/utils/progressive/buildProgressiveChecklistRows";
import type { ChecklistItemToggleEligibility } from "packages/features/checklists/utils/rules/checklistRules";
import { Box, Pressable, Text } from "packages/ui/components/structure/primitives";
import { DOTTED_BORDER_LIGHT_GRAY } from "packages/ui/components/structure/primitives/divider/dividerStyles";
import Card from "packages/ui/components/surfaces/cards/Card";

const sectionTitleClass =
  "text-responsive-sm font-semibold text-text-primary flex flex-row items-center gap-responsive-xs";

type ChecklistLayoutDisclosureSectionsProps = {
  sectionTitleText: string;
  useProgressive: boolean;
  segments: ProgressiveChecklistSegment[];
  displaySortedItems: TaskChecklistItem[];
  disclosure: ChecklistLayoutDisclosureState;
  setTypeDisclosure: (patch: Partial<ChecklistLayoutDisclosureState>) => void;
  futureHidden: number;
  checkedById: Record<number, boolean>;
  activeItemIds: number[];
  roadmapTab: ChecklistTab;
  getItemToggleEligibility: (
    section: ChecklistTab,
    itemId: number
  ) => ChecklistItemToggleEligibility;
  onToggleItem: (id: number) => Promise<void>;
  commitToggleItem: (id: number) => Promise<void>;
  toggleExpand: (id: number) => void;
  isExpanded: (id: number) => boolean;
  effectiveTransactionId: string | null | undefined;
  renderItemFooter: (itemId: number) => React.ReactNode;
};

export function ChecklistLayoutDisclosureSections({
  sectionTitleText,
  useProgressive,
  segments,
  displaySortedItems,
  disclosure,
  setTypeDisclosure,
  futureHidden,
  checkedById,
  activeItemIds,
  roadmapTab,
  getItemToggleEligibility,
  onToggleItem,
  commitToggleItem,
  toggleExpand,
  isExpanded,
  effectiveTransactionId,
  renderItemFooter,
}: ChecklistLayoutDisclosureSectionsProps) {
  const { t } = useLocalization();

  return (
    <Box className="w-full max-w-none self-center">
      <Card border="light" className="mb-responsive-md" padding="sm">
        <Box className={sectionTitleClass}>
          <Box className="flex h-4 w-4 flex-shrink-0 flex-row items-center justify-center lg:h-5 lg:w-5">
            <Icon name="check-square" className="text-foreground h-4 w-4 lg:h-5 lg:w-5" />
          </Box>
          {sectionTitleText}
        </Box>

        <Box className="mt-responsive-xs text-left">
          <Text className="sr-only">Checklist</Text>
          <Box className="flex flex-col gap-2 overflow-visible">
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
                  if (segment.kind === "completed_expanded_header") {
                    return (
                      <Pressable
                        key={`ceh-${segIdx}`}
                        onPress={() => setTypeDisclosure({ completedOpen: false })}
                        className={`flex flex-row items-center gap-2 rounded-lg px-3 py-2 ${DOTTED_BORDER_LIGHT_GRAY}`}
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
                        onPress={() => setTypeDisclosure({ futureOpen: true })}
                        className={`flex flex-row items-center gap-2 rounded-lg px-3 py-2 ${DOTTED_BORDER_LIGHT_GRAY}`}
                        accessibilityRole="button"
                        aria-expanded={false}
                      >
                        <Icon
                          name="chevron-right"
                          className="text-text-secondary h-4 w-4 shrink-0"
                        />
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
                      <ChecklistLayoutItemRow
                        key={`${segment.kind}-${segment.item.id}`}
                        item={segment.item}
                        rowKind={segment.kind}
                        globalIndex={segment.globalIndex}
                        checkedById={checkedById}
                        activeItemIds={activeItemIds}
                        roadmapTab={roadmapTab}
                        getItemToggleEligibility={getItemToggleEligibility}
                        onToggleItem={onToggleItem}
                        commitToggleItem={commitToggleItem}
                        toggleExpand={toggleExpand}
                        isExpanded={isExpanded}
                        transactionId={effectiveTransactionId}
                        renderItemFooter={renderItemFooter}
                      />
                    );
                  }
                  return null;
                })
              : displaySortedItems.map((item, index) => (
                  <ChecklistLayoutItemRow
                    key={`flat_item-${item.id}`}
                    item={item}
                    rowKind="flat_item"
                    globalIndex={index}
                    checkedById={checkedById}
                    activeItemIds={activeItemIds}
                    roadmapTab={roadmapTab}
                    getItemToggleEligibility={getItemToggleEligibility}
                    onToggleItem={onToggleItem}
                    commitToggleItem={commitToggleItem}
                    toggleExpand={toggleExpand}
                    isExpanded={isExpanded}
                    transactionId={effectiveTransactionId}
                    renderItemFooter={renderItemFooter}
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
                <Text className="text-text-secondary text-sm font-medium">
                  {t("checklists.progressive.show_more_expanded")}
                </Text>
              </Pressable>
            ) : null}
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
