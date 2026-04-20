import React, { useCallback, useMemo, useState } from "react";

import { useNavigation } from "@react-navigation/native";
import { RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLocalization } from "packages/contexts";
import { useAgentClients } from "packages/features/agent";
import type { DocumentData } from "packages/features/documents";
import { SavedDocumentsList } from "packages/features/saved/components/layout/SavedDocumentsList.native";
import { SavedHeader } from "packages/features/saved/components/layout/SavedHeader.native";
import { SavedHomesList } from "packages/features/saved/components/layout/SavedHomesList.native";
import type { SavedPageLayoutProps } from "packages/features/saved/components/layout/SavedPageLayout";
import { SavedPageNativeCompareBar } from "packages/features/saved/components/SavedPageNativeCompareBar.native";
import { SavedPageNativeModals } from "packages/features/saved/components/SavedPageNativeModals.native";
import type { SavedHome } from "packages/types";
import { ScrollView } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";
import { filterDocumentLibraryExcludingAgreements } from "packages/utils/documents";

type _EventTypeFilter = "listed" | "price_change" | "sold" | "withdrawn" | "";

export function SavedPageLayout(nativeProps: SavedPageLayoutProps) {
  const insets = useSafeAreaInsets();
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
    onViewSignedAgreement: _onViewSignedAgreement,
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
  const { clients } = useAgentClients();

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

  const sortedDocumentsExcludingAgreements = useMemo(
    () => filterDocumentLibraryExcludingAgreements(sortedDocuments),
    [sortedDocuments]
  );

  const sortedAgreementDocuments = useMemo(
    () => sortedDocuments.filter((d) => d.library_kind === "agreement"),
    [sortedDocuments]
  );

  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);

  const handleRefresh = useCallback(() => {
    if (!refresh) return;
    void refresh();
  }, [refresh]);

  const homesCount = filteredHomes.length;
  const documentsCount =
    viewType === "documents"
      ? sortedDocumentsExcludingAgreements.length
      : viewType === "agreements"
        ? sortedAgreementDocuments.length
        : (filteredDocuments as DocumentData[]).length;

  const isRefreshing = Boolean(refresh && refreshing);

  const selectedClientName = useMemo(() => {
    if (!isAgent) return null;
    if (!selectedClientId) {
      return t("client_selector.me", { defaultValue: "Me" });
    }
    const match = clients.find((client) => client.id === selectedClientId);
    return match?.name ?? t("client_selector.select_client", { defaultValue: "Select client" });
  }, [clients, isAgent, selectedClientId, t]);

  const handleUnlockHome = useCallback(
    (home: SavedHome) => {
      const address = home.address ?? home.description ?? "";
      (
        navigation as unknown as {
          navigate: (routeName: string, params?: Record<string, unknown>) => void;
        }
      ).navigate("PropertyDetails", {
        address: address || home.home_id,
        propertyId: home.home_id,
      });
    },
    [navigation]
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
    isDocumentsView && !documentsLoadingCombined && sortedDocumentsExcludingAgreements.length === 0;

  const handleEventTypeFilterChange = useCallback(
    (next: _EventTypeFilter) => {
      if (!setEventTypeFilter) return;
      setEventTypeFilter(next);
    },
    [setEventTypeFilter]
  );

  return (
    <>
      <SavedPageNativeModals
        currentPdf={currentPdf}
        currentDocumentId={currentDocumentId}
        currentDocumentName={currentDocumentName}
        closePdfModal={closePdfModal}
        isCompareModalOpen={isCompareModalOpen}
        setIsCompareModalOpen={setIsCompareModalOpen}
        isNegotiationModalOpen={isNegotiationModalOpen}
        selectedHomeForNegotiation={selectedHomeForNegotiation}
        onCloseNegotiation={onCloseNegotiation}
        selectedHomesData={selectedHomesData}
        onRemoveFromComparison={onRemoveFromComparison}
        isDocumentUploadModalOpen={isDocumentUploadModalOpen}
        setIsDocumentUploadModalOpen={setIsDocumentUploadModalOpen}
        refetchDocuments={_refetchDocuments}
        isAgent={isAgent}
        selectedClientId={selectedClientId}
        setSelectedClientId={setSelectedClientId}
        isClientSelectorOpen={isClientSelectorOpen}
        onCloseClientSelector={() => setIsClientSelectorOpen(false)}
      />

      <ScrollView
        className="bg-background-base flex-1"
        refreshControl={
          refresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          ) : undefined
        }
        contentContainerStyle={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 24,
          paddingBottom: Math.max(32, 16 + insets.bottom),
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
          onUploadDocument={isAgent ? () => setIsDocumentUploadModalOpen(true) : undefined}
        />

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

        {isDocumentsView && (
          <SavedDocumentsList
            sortedDocuments={sortedDocumentsExcludingAgreements}
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

        {isHomesView && (
          <SavedPageNativeCompareBar
            selectedHomesData={selectedHomesData}
            onCompare={onCompare}
            onClearComparison={onClearComparison}
          />
        )}
      </ScrollView>
    </>
  );
}
