import React, { useCallback, useMemo, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import Button from "@ui/button/Button";
import { RefreshControl } from "react-native";

import { useLocalization } from "packages/contexts";
import { useAgentClients } from "packages/features/agent";
import type { DocumentData } from "packages/features/documents";
import { SavedDocumentsList } from "packages/features/saved/components/layout/SavedDocumentsList.native";
import { SavedHeader } from "packages/features/saved/components/layout/SavedHeader.native";
import { SavedHomesList } from "packages/features/saved/components/layout/SavedHomesList.native";
import type { SavedPageLayoutProps } from "packages/features/saved/components/layout/SavedPageLayout";
import DocumentUploadModal from "packages/features/saved/components/upload/DocumentUploadModal";
import type { SavedHome } from "packages/types";
import { BaseModal, PdfModal } from "packages/ui/components/modals";
import { Box, ScrollView, Text } from "packages/ui/components/primitives";
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
    onSendForSignature,
    onSignNow,
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

  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);

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
    return (
      match?.name ??
      t("client_selector.select_client", { defaultValue: "Select client" })
    );
  }, [clients, isAgent, selectedClientId, t]);

  const handleUnlockHome = useCallback(
    (home: SavedHome) => {
      const address = home.address ?? home.description ?? "";
      (
        navigation as unknown as {
          navigate: (
            routeName: string,
            params?: Record<string, unknown>,
          ) => void;
        }
      ).navigate("PropertyDetails", {
        address: address || home.home_id,
        propertyId: home.home_id,
      });
    },
    [navigation],
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
    isDocumentsView &&
    !documentsLoadingCombined &&
    sortedDocuments.length === 0;

  const handleEventTypeFilterChange = useCallback(
    (next: _EventTypeFilter) => {
      if (!setEventTypeFilter) return;
      setEventTypeFilter(next);
    },
    [setEventTypeFilter],
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
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          ) : undefined
        }
        contentContainerStyle={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 24,
          paddingBottom: 32,
        }}
      >
        <SavedHeader
          viewType={viewType}
          setViewType={setViewType}
          summaryCountText={summaryCountText}
          isAgent={isAgent}
          selectedClientName={selectedClientName}
          onOpenClientSelector={() => setIsClientSelectorOpen(true)}
          isDocumentsView={isDocumentsView}
          eventTypeFilter={eventTypeFilter}
          onEventTypeFilterChange={handleEventTypeFilterChange}
          onUploadDocument={
            isAgent ? () => setIsDocumentUploadModalOpen(true) : undefined
          }
        />

        {/* Homes view content */}
        {isHomesView && (
          <SavedHomesList
            filteredHomes={filteredHomes}
            selectedHomesForComparison={selectedHomesForComparison}
            loading={loading}
            showEmpty={showEmptyHomes}
            onToggleHomeSelection={onToggleHomeSelection}
            onUnlockHome={handleUnlockHome}
          />
        )}

        {/* Documents content */}
        {isDocumentsView && (
          <SavedDocumentsList
            sortedDocuments={sortedDocuments}
            loading={documentsLoadingCombined}
            showEmpty={showEmptyDocuments}
            isAgent={isAgent}
            onViewDocument={onViewDocument}
            onDownloadDocument={onDownloadDocument}
            onShareDocument={onShareDocument}
            onSendForSignature={onSendForSignature}
            onSignNow={onSignNow}
            onDocumentDelete={onDocumentDelete}
          />
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
              <Button
                variant="primary"
                size="sm"
                onPress={onCompare}
                className="flex-1"
              >
                <Text className="text-sm font-medium">
                  {t("saved.compare_now", { defaultValue: "Compare now" })}
                </Text>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onPress={onClearComparison}
                className="flex-1"
              >
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
                <Text
                  className="text-text-primary text-sm font-semibold"
                  numberOfLines={2}
                >
                  {home.address ?? home.description ?? ""}
                </Text>
                <Text className="text-text-secondary mt-1 text-xs">
                  {formatPrice(
                    home.price as string | number | null | undefined,
                  )}
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
            <Text
              className="text-text-primary text-sm font-semibold"
              numberOfLines={2}
            >
              {selectedHomeForNegotiation.address ??
                selectedHomeForNegotiation.description ??
                ""}
            </Text>
            <Text className="text-text-secondary mt-1 text-xs">
              {formatPrice(
                selectedHomeForNegotiation.price as
                  | string
                  | number
                  | null
                  | undefined,
              )}
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
                  variant={
                    selectedClientId === client.id ? "primary" : "secondary"
                  }
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
