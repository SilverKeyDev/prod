/* eslint-disable silverkey/max-lines-hard, max-lines-per-function -- TODO: split into subcomponents (SavedHomesList, SavedDocumentsList, etc.) */
import React, { useCallback, useMemo, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import Button from "@ui/button/Button";
import { Icon } from "@ui/icons";
import { RefreshControl } from "react-native";

import { useLocalization } from "packages/contexts";
import { color } from "packages/design-tokens";
import { useAgentClients } from "packages/features/agent";
import type { DocumentData } from "packages/features/documents";
import type { SavedPageLayoutProps } from "packages/features/saved/components/layout/SavedPageLayout";
import { SavedHomeCard } from "packages/features/saved/components/SavedHomeCard";
import DocumentUploadModal from "packages/features/saved/components/upload/DocumentUploadModal";
import type { SavedHome } from "packages/types";
import { BaseModal, PdfModal } from "packages/ui/components/modals";
import { Box, ScrollView, Text } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import { dateParseISO } from "packages/utils/date";

type _EventTypeFilter = "listed" | "price_change" | "sold" | "withdrawn" | "";

function formatPrice(value: string | number | null | undefined): string {
  if (value == null) return "Price N/A";
  const asNumber =
    typeof value === "string"
      ? Number(value.replace(/[^0-9.-]/g, ""))
      : typeof value === "number"
        ? value
        : Number.NaN;
  if (!Number.isFinite(asNumber)) return String(value);
  return `$${asNumber.toLocaleString()}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const parsed = dateParseISO(value);
    if (!parsed.isValid()) return "";
    return parsed.toDate().toLocaleDateString();
  } catch {
    return "";
  }
}

export function SavedPageLayout(nativeProps: SavedPageLayoutProps) {
  const navigation = useNavigation();
  const {
    viewType,
    searchTerm: _searchTerm,
    setSearchTerm: _setSearchTerm,
    selectedClientId,
    setSelectedClientId,
    eventTypeFilter,
    setEventTypeFilter,
    setViewType,
    filteredHomes,
    filteredDocuments,
    loading,
    documentsLoadingState,
    selectedHomesForComparison,
    selectedHomesData,
    selectedProperty: _selectedProperty,
    isLoadingPropertyDetails: _isLoadingPropertyDetails,
    isCompareModalOpen,
    setIsCompareModalOpen,
    isNegotiationModalOpen,
    selectedHomeForNegotiation,
    isDocumentUploadModalOpen,
    setIsDocumentUploadModalOpen,
    isAgent,
    homes,
    currentPdf,
    currentDocumentId,
    currentDocumentName,
    closePdfModal,
    onViewDocument,
    onDownloadDocument,
    onShareDocument,
    onToggleHomeSelection,
    onUnlockHome: _onUnlockHome,
    onDocumentDelete,
    onRemoveFromComparison,
    onCloseNegotiation,
    onCompare,
    onClearComparison,
    clearSelectedProperty: _clearSelectedProperty,
    refetchDocuments: _refetchDocuments,
    refresh,
    refreshing,
  } = nativeProps;

  const { t } = useLocalization();
  const { clients, isLoading: isLoadingClients } = useAgentClients();
  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);

  const isHomesView = viewType === "homes";
  const isDocumentsView = viewType === "documents";

  const documentsLoadingCombined = documentsLoadingState;

  const sortedDocuments = useMemo(() => {
    const toMs = (v: number | string | null | undefined) =>
      typeof v === "number" ? v : v ? dateParseISO(v).valueOf() : 0;
    return [...(filteredDocuments as DocumentData[])].sort((a, b) => {
      const dateA = toMs(a.created_at ?? a.updated_at);
      const dateB = toMs(b.created_at ?? b.updated_at);
      return dateB - dateA;
    });
  }, [filteredDocuments]);

  const handleRefresh = useCallback(() => {
    if (!refresh) return;
    void refresh();
  }, [refresh]);

  const homesCount = filteredHomes.length;
  const documentsCount = (filteredDocuments as DocumentData[]).length;

  const isRefreshing = Boolean(refresh && refreshing);

  const selectedClientName = useMemo(() => {
    if (!isAgent) return null;
    if (!selectedClientId) {
      return t("client_selector.me", { defaultValue: "Me" });
    }
    const match = clients.find((client) => client.id === selectedClientId);
    return match?.name ?? t("client_selector.select_client", { defaultValue: "Select client" });
  }, [clients, isAgent, selectedClientId, t]);

  const eventTypeFilterOptions: Array<{
    value: _EventTypeFilter;
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

  const handleUnlockHome = useCallback(
    (home: SavedHome) => {
      const address = home.address ?? home.description ?? "";
      navigation.navigate(
        "PropertyDetails" as never,
        {
          address: address || home.home_id,
          propertyId: home.home_id,
        } as never
      );
    },
    [navigation]
  );

  const renderDocument = useCallback(
    (doc: DocumentData) => (
      <Box
        key={`doc-${doc.id}`}
        className="border-border bg-background-surface mb-3 rounded-lg border p-3 shadow-sm"
      >
        <Text className="text-text-primary text-sm font-semibold" numberOfLines={2}>
          {doc.address || doc.filename}
        </Text>
        <Text className="text-text-secondary mt-1 text-xs">
          {formatDate(doc.created_at)} · {doc.document_type ?? "Document"}
        </Text>
        <Box className="mt-3 flex flex-row flex-wrap gap-2">
          {onViewDocument && (
            <Button
              variant="primary"
              size="sm"
              onPress={() => onViewDocument(doc.id, doc.filename)}
              className="min-w-[30%] flex-1"
            >
              <Text className="text-sm font-medium">
                {t("saved.view_document", { defaultValue: "View" })}
              </Text>
            </Button>
          )}
          {onDownloadDocument && (
            <Button
              variant="secondary"
              size="sm"
              onPress={() => onDownloadDocument(doc.id, doc.filename)}
              className="min-w-[30%] flex-1"
            >
              <Text className="text-sm font-medium">
                {t("saved.download_document", { defaultValue: "Download" })}
              </Text>
            </Button>
          )}
          {onShareDocument && (
            <Button
              variant="secondary"
              size="sm"
              onPress={() => onShareDocument(doc.id, doc.filename)}
              className="min-w-[30%] flex-1"
            >
              <Text className="text-sm font-medium">
                {t("saved.share_document", { defaultValue: "Share" })}
              </Text>
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onPress={() => onDocumentDelete(doc.id)}
            className="min-w-[30%] flex-1"
          >
            <Text className="text-sm font-medium text-red-700">
              {t("saved.delete_document", { defaultValue: "Delete" })}
            </Text>
          </Button>
        </Box>
      </Box>
    ),
    [onDocumentDelete, onDownloadDocument, onShareDocument, onViewDocument, t]
  );

  const summaryCountText =
    viewType === "homes"
      ? t("saved.homes_count", {
          defaultValue: "{{count}} saved",
          count: homesCount,
        })
      : t("saved.documents_count", {
          defaultValue: "{{count}} documents",
          count: documentsCount,
        });

  const showEmptyHomes =
    isHomesView && !loading && filteredHomes.length === 0 && homes.length === 0;
  const showEmptyDocuments =
    isDocumentsView && !documentsLoadingCombined && sortedDocuments.length === 0;

  const handleEventTypeFilterChange = useCallback(
    (next: _EventTypeFilter) => {
      if (!setEventTypeFilter) return;
      setEventTypeFilter(next);
    },
    [setEventTypeFilter]
  );

  return (
    <>
      <PdfModal
        currentPdf={currentPdf}
        currentReportAddress={currentDocumentName}
        reportId={currentDocumentId}
        onClose={closePdfModal}
      />

      <ScrollView
        className="bg-background-base flex-1"
        refreshControl={
          refresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          ) : undefined
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
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
                  <Icon name="home" size={props.size ?? 14} color={props.color ?? color("navy")} />
                ),
              },
              {
                id: "documents" as const,
                label: t("saved.tab_documents", { defaultValue: "Documents" }),
                icon: (props: { size?: number; color?: string }) => (
                  <Icon
                    name="file-text"
                    size={props.size ?? 14}
                    color={props.color ?? color("navy")}
                  />
                ),
              },
            ].map((tab, index) => {
              const isFirst = index === 0;
              const isLast = index === 1;
              const isActive =
                (tab.id === "homes" && isHomesView) || (tab.id === "documents" && isDocumentsView);
              return (
                <Box key={tab.id} className="min-w-0 flex-1 flex-row items-center">
                  <Button
                    variant="ghost"
                    onPress={() => setViewType(tab.id)}
                    className={`relative flex-1 items-center justify-center py-1.5 ${
                      isActive ? "font-semibold" : "rounded-lg font-medium"
                    }`}
                  >
                    <Box className="flex-row items-center justify-center gap-1.5">
                      <tab.icon size={14} color={color("navy")} />
                      <BodyText as="span" size="sm" className="text-text-primary" numberOfLines={1}>
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
                size="xs"
                onPress={() => setIsClientSelectorOpen(true)}
                className="shrink-0 px-2 py-1"
              >
                <Text className="text-xs font-medium">
                  {selectedClientName ??
                    t("saved.select_client_button", {
                      defaultValue: "Select client",
                    })}
                </Text>
              </Button>
            )}
            {isDocumentsView && setEventTypeFilter && (
              <Box className="flex flex-row flex-wrap gap-1.5">
                {eventTypeFilterOptions.map((option) => (
                  <Button
                    key={option.value || "all"}
                    variant={eventTypeFilter === option.value ? "primary" : "secondary"}
                    size="xs"
                    onPress={() => handleEventTypeFilterChange(option.value)}
                    className="px-2 py-1"
                  >
                    <Text className="text-xs font-medium">{option.label}</Text>
                  </Button>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* Agent-only actions for documents view */}
        {isDocumentsView && isAgent && (
          <Box className="mb-4 flex flex-row gap-2">
            <Button
              variant="secondary"
              size="sm"
              onPress={() => setIsDocumentUploadModalOpen(true)}
              className="flex-1"
            >
              <Text className="text-sm font-medium">
                {t("saved.upload_document", {
                  defaultValue: "Upload document",
                })}
              </Text>
            </Button>
          </Box>
        )}

        {/* Homes view content */}
        {isHomesView && (
          <>
            {loading && filteredHomes.length === 0 ? (
              <Box className="py-8">
                <Text className="text-text-secondary text-center text-sm">
                  {t("saved.loading_homes", {
                    defaultValue: "Loading saved homes…",
                  })}
                </Text>
              </Box>
            ) : null}

            {showEmptyHomes ? (
              <Box className="py-8">
                <Text className="text-text-secondary text-center text-sm">
                  {t("saved.no_homes_yet", {
                    defaultValue: "No saved homes yet. Save homes from Search to see them here.",
                  })}
                </Text>
              </Box>
            ) : null}

            {filteredHomes.map((home) => (
              <SavedHomeCard
                key={home.home_id}
                home={home}
                isSelected={selectedHomesForComparison.has(home.home_id)}
                onToggleCompare={onToggleHomeSelection}
                onUnlock={handleUnlockHome}
              />
            ))}
          </>
        )}

        {/* Documents content */}
        {isDocumentsView && (
          <>
            {documentsLoadingCombined ? (
              <Box className="py-8">
                <Text className="text-text-secondary text-center text-sm">
                  {t("saved.loading_documents", {
                    defaultValue: "Loading documents…",
                  })}
                </Text>
              </Box>
            ) : null}

            {showEmptyDocuments ? (
              <Box className="py-8">
                <Text className="text-text-secondary text-center text-sm">
                  {t("saved.no_documents_yet", {
                    defaultValue: "No documents yet. Upload documents to see them here.",
                  })}
                </Text>
              </Box>
            ) : null}

            {sortedDocuments.map((doc) => renderDocument(doc))}
          </>
        )}

        {/* Compare selection bar */}
        {isHomesView && selectedHomesData.length >= 1 && (
          <Box className="border-border bg-background-surface mt-4 rounded-lg border p-3">
            <Text className="text-text-primary text-sm font-medium">
              {t("saved.compare_bar_title", {
                defaultValue: "Compare selected homes",
              })}
            </Text>
            <Text className="text-text-secondary mt-1 text-xs">
              {t("saved.compare_bar_subtitle", {
                defaultValue: "{{count}} selected",
                count: selectedHomesData.length,
              })}
            </Text>
            <Box className="mt-3 flex flex-row gap-2">
              <Button variant="primary" size="sm" onPress={onCompare} className="flex-1">
                <Text className="text-sm font-medium">
                  {t("saved.compare_now", { defaultValue: "Compare now" })}
                </Text>
              </Button>
              <Button variant="secondary" size="sm" onPress={onClearComparison} className="flex-1">
                <Text className="text-sm font-medium">
                  {t("saved.clear_selection", { defaultValue: "Clear" })}
                </Text>
              </Button>
            </Box>
          </Box>
        )}
      </ScrollView>

      {/* Compare modal */}
      <BaseModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title={t("saved.compare_modal_title", {
          defaultValue: "Compare homes",
        })}
      >
        {selectedHomesData.length === 0 ? (
          <Text className="text-text-secondary text-sm">
            {t("saved.compare_modal_empty", {
              defaultValue: "Select at least two homes to compare.",
            })}
          </Text>
        ) : (
          <>
            {selectedHomesData.map((home) => (
              <Box
                key={home.home_id}
                className="border-border bg-background-surface mb-3 rounded-md border p-3"
              >
                <Text className="text-text-primary text-sm font-semibold" numberOfLines={2}>
                  {home.address ?? home.description ?? ""}
                </Text>
                <Text className="text-text-secondary mt-1 text-xs">
                  {formatPrice(home.price as string | number | null | undefined)}
                </Text>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => onRemoveFromComparison(home.home_id)}
                  className="mt-2 self-start"
                >
                  <Text className="text-xs font-medium">
                    {t("saved.remove_from_compare", { defaultValue: "Remove" })}
                  </Text>
                </Button>
              </Box>
            ))}
          </>
        )}
      </BaseModal>

      {/* Negotiation modal (simplified for mobile) */}
      <BaseModal
        isOpen={isNegotiationModalOpen}
        onClose={onCloseNegotiation}
        title={t("saved.negotiate_modal_title", { defaultValue: "Negotiate" })}
      >
        {selectedHomeForNegotiation ? (
          <>
            <Text className="text-text-primary text-sm font-semibold" numberOfLines={2}>
              {selectedHomeForNegotiation.address ?? selectedHomeForNegotiation.description ?? ""}
            </Text>
            <Text className="text-text-secondary mt-1 text-xs">
              {formatPrice(selectedHomeForNegotiation.price as string | number | null | undefined)}
            </Text>
            <Text className="text-text-secondary mt-3 text-sm">
              {t("saved.negotiate_modal_body", {
                defaultValue:
                  "Start the conversation with your agent from Messaging to discuss this home.",
              })}
            </Text>
          </>
        ) : (
          <Text className="text-text-secondary text-sm">
            {t("saved.negotiate_modal_empty", {
              defaultValue: "Select a home to start negotiation.",
            })}
          </Text>
        )}
      </BaseModal>

      <DocumentUploadModal
        isOpen={isDocumentUploadModalOpen}
        onClose={() => setIsDocumentUploadModalOpen(false)}
        onUploadSuccess={_refetchDocuments}
      />

      {/* Client selector modal (agents only) */}
      {isAgent && (
        <BaseModal
          isOpen={isClientSelectorOpen}
          onClose={() => setIsClientSelectorOpen(false)}
          title={t("saved.select_client_modal_title", {
            defaultValue: "Select client",
          })}
        >
          {isLoadingClients ? (
            <Text className="text-text-secondary text-sm">
              {t("client_selector.loading_clients", {
                defaultValue: "Loading clients…",
              })}
            </Text>
          ) : clients.length === 0 ? (
            <Text className="text-text-secondary text-sm">
              {t("client_selector.no_clients_found", {
                defaultValue: "No clients found.",
              })}
            </Text>
          ) : (
            <>
              <Button
                variant={selectedClientId === null ? "primary" : "secondary"}
                size="sm"
                onPress={() => {
                  setSelectedClientId(null);
                  setIsClientSelectorOpen(false);
                }}
                className="mb-2 w-full"
              >
                <Text className="text-sm font-medium">
                  {t("client_selector.me", { defaultValue: "Me" })}
                </Text>
              </Button>
              {clients.map((client) => (
                <Button
                  key={client.id}
                  variant={selectedClientId === client.id ? "primary" : "secondary"}
                  size="sm"
                  onPress={() => {
                    setSelectedClientId(client.id);
                    setIsClientSelectorOpen(false);
                  }}
                  className="mb-2 w-full"
                >
                  <Text className="text-sm font-medium">{client.name}</Text>
                </Button>
              ))}
            </>
          )}
        </BaseModal>
      )}

    </>
  );
}
