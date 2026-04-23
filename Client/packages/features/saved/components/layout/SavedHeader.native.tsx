import React, { useMemo } from "react";

import Button from "@ui/button/Button";
import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import type { SavedPageViewType } from "packages/features/documents";
import { LibrarySortControlNative } from "packages/features/saved/components/header/LibrarySortControl.native";
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
  const _isHomesView = viewType === "homes";

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
      {/* Toolbar: checklists-style tabs + client + event filter */}
      <Box className="border-border bg-background-surface mb-3 rounded-lg border border-b">
        <Box className="px-2 pt-2">
          <Box className="items-center">
            <BodyText size="sm" className="text-text-primary" as="p">
              {summaryCountText}
            </BodyText>
          </Box>
        </Box>

        {/* Tabs bar (checklists-style: icon + label, gold underline) */}
        <Box className="mt-3 flex-row items-center justify-center">
          {[
            {
              id: "homes" as const,
              label: t("saved.tab_homes", { defaultValue: "Homes" }),
              icon: (props: { size?: number; color?: string }) => (
                <Icon name="home" size={props.size ?? 16} color={props.color ?? color("navy")} />
              ),
            },
            {
              id: "documents" as const,
              label: t("saved.tab_documents", { defaultValue: "Documents" }),
              icon: (props: { size?: number; color?: string }) => (
                <Icon
                  name="file-text"
                  size={props.size ?? 16}
                  color={props.color ?? color("navy")}
                />
              ),
            },
            {
              id: "agreements" as const,
              label: t("saved.tab_agreements", { defaultValue: "DocuSign" }),
              icon: (props: { size?: number; color?: string }) => (
                <Icon
                  name="file-signature"
                  size={props.size ?? 16}
                  color={props.color ?? color("navy")}
                />
              ),
            },
          ].map((tab, index, arr) => {
            const isFirst = index === 0;
            const isLast = index === arr.length - 1;
            const isActive = tab.id === viewType;
            return (
              <Box key={tab.id} className="min-w-0 flex-1 flex-row items-center">
                <Button
                  variant="ghost"
                  onPress={() => setViewType(tab.id)}
                  className={`relative flex-1 items-center justify-center py-2 ${
                    isActive ? "font-semibold" : "rounded-lg font-medium"
                  }`}
                >
                  <Box className="flex-row items-center justify-center gap-1.5">
                    <tab.icon size={16} color={color("navy")} />
                    <BodyText as="span" size="md" className="text-text-primary" numberOfLines={1}>
                      {tab.label}
                    </BodyText>
                  </Box>
                  {isActive && (
                    <Box
                      className={`bg-accent absolute bottom-0 h-0.5 ${
                        isFirst
                          ? "left-2 right-2 rounded-l-full"
                          : isLast
                            ? "left-2 right-2 rounded-r-full"
                            : "left-2 right-2 rounded-full"
                      }`}
                    />
                  )}
                </Button>
                {index < 1 ? <Box className="bg-border h-4 w-px flex-shrink-0" /> : null}
              </Box>
            );
          })}
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
