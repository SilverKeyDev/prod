import React, { useMemo } from "react";

import Button from "@ui/button/Button";
import { Icon } from "@ui/icons";
import { TextInput } from "react-native";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import type { SavedPageViewType } from "packages/features/documents";
import { LibrarySortControlNative } from "packages/features/saved/components/header/LibrarySortControl.native";
import { LibraryViewModeToggle } from "packages/features/saved/components/header/LibraryViewModeToggle";
import { SavedPageViewUnderlineTabs } from "packages/features/saved/components/header/SavedPageViewUnderlineTabs";
import type { LibraryViewMode } from "packages/features/saved/hooks/ui/useLibraryViewMode";
import { SAVED_PAGE_SEARCH_INPUT_CLASS } from "packages/features/saved/utils/constants";
import { Box, Text } from "packages/ui/components/primitives";
import { INPUT_LEFT_ICON_WRAPPER_CLASSES } from "packages/ui/styles/variants/inputVariants";

type EventTypeFilter = "listed" | "price_change" | "sold" | "withdrawn" | "";

interface SavedHeaderProps {
  viewType: SavedPageViewType;
  setViewType: (viewType: SavedPageViewType) => void;
  isAgent: boolean;
  selectedClientName: string | null;
  onOpenClientSelector: () => void;
  isDocumentsView: boolean;
  eventTypeFilter?: EventTypeFilter;
  onEventTypeFilterChange: (filter: EventTypeFilter) => void;
  onUploadDocument?: () => void;
  librarySortKey: string;
  onLibrarySortChange: (value: string) => void;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  libraryViewMode?: LibraryViewMode;
  onLibraryViewModeChange?: (mode: LibraryViewMode) => void;
  showLibraryViewToggle?: boolean;
}

export function SavedHeader({
  viewType,
  setViewType,
  isAgent,
  selectedClientName,
  onOpenClientSelector,
  isDocumentsView,
  eventTypeFilter,
  onEventTypeFilterChange,
  onUploadDocument,
  librarySortKey,
  onLibrarySortChange,
  searchTerm = "",
  onSearchChange,
  libraryViewMode = "grid",
  onLibraryViewModeChange,
  showLibraryViewToggle = true,
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
        <Box className="w-full px-2 pt-2">
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
          <Box className="flex flex-row flex-wrap items-center justify-between gap-2">
            <LibrarySortControlNative
              viewType={viewType}
              value={librarySortKey}
              onChange={onLibrarySortChange}
            />
            {viewType === "forms-library" && showLibraryViewToggle && onLibraryViewModeChange ? (
              <LibraryViewModeToggle
                viewMode={libraryViewMode}
                onViewModeChange={onLibraryViewModeChange}
              />
            ) : null}
          </Box>
        </Box>
        {viewType === "forms-library" && onSearchChange ? (
          <Box className="px-2 pb-2">
            <Box className="relative w-full">
              <Box className={INPUT_LEFT_ICON_WRAPPER_CLASSES}>
                <Icon name="search" className="h-4 w-4" />
              </Box>
              <TextInput
                value={searchTerm}
                onChangeText={onSearchChange}
                placeholder={t("saved.search_forms_placeholder")}
                className={`${SAVED_PAGE_SEARCH_INPUT_CLASS} pl-10`}
                placeholderTextColor={color("neutral.400")}
              />
            </Box>
          </Box>
        ) : null}
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
