import React, { useMemo } from "react";

import Button from "@ui/button/Button";

import { useLocalization } from "packages/contexts";
import type { SavedPageViewType } from "packages/features/documents";
import { LibrarySortControlNative } from "packages/features/saved/components/header/LibrarySortControl.native";
import { SavedPageViewUnderlineTabs } from "packages/features/saved/components/header/SavedPageViewUnderlineTabs";
import { Box, Text } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

type EventTypeFilter = "listed" | "price_change" | "sold" | "withdrawn" | "";

interface SavedHeaderProps {
  viewType: SavedPageViewType;
  setViewType: (viewType: SavedPageViewType) => void;
  summaryCountText: string;
  isAgent: boolean;
  selectedClientName: string | null;
  onOpenClientSelector: () => void;
  isDocumentsView: boolean;
  eventTypeFilter?: EventTypeFilter;
  onEventTypeFilterChange: (filter: EventTypeFilter) => void;
  onUploadDocument?: () => void;
  librarySortKey: string;
  onLibrarySortChange: (value: string) => void;
}

export function SavedHeader({
  viewType,
  setViewType,
  summaryCountText,
  isAgent,
  selectedClientName,
  onOpenClientSelector,
  isDocumentsView,
  eventTypeFilter,
  onEventTypeFilterChange,
  onUploadDocument,
  librarySortKey,
  onLibrarySortChange,
}: SavedHeaderProps) {
  const { t } = useLocalization();

  const eventTypeFilterOptions: Array<{
    value: EventTypeFilter;
    label: string;
  }> = useMemo(
    () => [
      {
        value: "",
        label: t("saved.filter_all_events", { defaultValue: "All activity" }),
      },
      {
        value: "listed",
        label: t("saved.filter_listed", { defaultValue: "Listed" }),
      },
      {
        value: "price_change",
        label: t("saved.filter_price_change", {
          defaultValue: "Price changes",
        }),
      },
      {
        value: "sold",
        label: t("saved.filter_sold", { defaultValue: "Sold" }),
      },
      {
        value: "withdrawn",
        label: t("saved.filter_withdrawn", { defaultValue: "Withdrawn" }),
      },
    ],
    [t]
  );

  return (
    <>
      {/* Toolbar: saved view tabs + client + event filter */}
      <Box className="border-border bg-background-surface mb-3 rounded-lg border border-b">
        <Box className="px-2 pt-2">
          <Box className="items-center">
            <BodyText size="sm" className="text-text-primary" as="p">
              {summaryCountText}
            </BodyText>
          </Box>
        </Box>

        <Box className="mt-3 w-full px-2">
          <SavedPageViewUnderlineTabs
            isAgent={isAgent}
            viewType={viewType}
            onViewTypeChange={setViewType}
            className="mb-0 w-full"
          />
        </Box>

        {/* Client selector + event filter row */}
        <Box className="mt-3 flex flex-row flex-wrap items-center justify-between gap-2 px-2 pb-2">
          {isAgent && (
            <Button
              variant="secondary"
              size="sm"
              onPress={onOpenClientSelector}
              className="shrink-0 px-2 py-1"
              iconName="save"
            >
              <Text className="text-xs font-medium">
                {selectedClientName ??
                  t("saved.select_client_button", {
                    defaultValue: "Select client",
                  })}
              </Text>
            </Button>
          )}
          {isDocumentsView && eventTypeFilter !== undefined && (
            <Box className="flex flex-row flex-wrap gap-1.5">
              {eventTypeFilterOptions.map((option) => (
                <Button
                  key={option.value || "all"}
                  variant={eventTypeFilter === option.value ? "primary" : "secondary"}
                  size="sm"
                  onPress={() => onEventTypeFilterChange(option.value)}
                  className="px-2 py-1"
                >
                  <Text className="text-xs font-medium">{option.label}</Text>
                </Button>
              ))}
            </Box>
          )}
        </Box>

        <Box className="px-2 pb-2">
          <LibrarySortControlNative
            viewType={viewType}
            value={librarySortKey}
            onChange={onLibrarySortChange}
          />
        </Box>
      </Box>

      {/* Agent-only actions for documents view */}
      {isDocumentsView && isAgent && onUploadDocument && (
        <Box className="mb-4 flex flex-row gap-2">
          <Button
            variant="secondary"
            size="sm"
            onPress={onUploadDocument}
            className="flex-1"
            iconName="save"
          >
            <Text className="text-sm font-medium">
              {t("saved.upload_document", {
                defaultValue: "Upload document",
              })}
            </Text>
          </Button>
        </Box>
      )}
    </>
  );
}
