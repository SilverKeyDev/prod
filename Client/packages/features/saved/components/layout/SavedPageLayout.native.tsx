import React, { useCallback, useMemo, useState } from "react";

import { RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useLocalization } from "packages/contexts";
import { useAgentClients } from "packages/features/agent";
import type { DocumentData } from "packages/features/documents";
import { FormsLibraryTab } from "packages/features/documents";
import { SavedDocumentsList } from "packages/features/saved/components/layout/SavedDocumentsList.native";
import { SavedHeader } from "packages/features/saved/components/layout/SavedHeader.native";
import type { SavedPageLayoutProps } from "packages/features/saved/components/layout/SavedPageLayout";
import { SavedPageNativeModals } from "packages/features/saved/components/SavedPageNativeModals.native";
import { sortDocumentsForLibrary } from "packages/features/saved/utils/librarySort";
import { ScrollView } from "packages/ui/components/primitives";
import { filterDocumentLibraryExcludingAgreements } from "packages/utils/documents";

type _EventTypeFilter = "listed" | "price_change" | "sold" | "withdrawn" | "";

export function SavedPageLayout(nativeProps: SavedPageLayoutProps) {
  const insets = useSafeAreaInsets();
  const {
    viewType,
    searchTerm,
    setSearchTerm,
    selectedClientId,
    setSelectedClientId,
    eventTypeFilter,
    setEventTypeFilter,
    setViewType,
    libraryViewMode,
    onLibraryViewModeChange,
    showLibraryViewToggle,
    filteredHomes: _filteredHomes,
    filteredDocuments,
    loading: _loading,
    documentsLoadingState,
    selectedHomesForComparison: _selectedHomesForComparison,
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
    homes: _homes,
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
    onToggleHomeSelection: _onToggleHomeSelection,
    onUnlockHome: _onUnlockHome,
    onDocumentDelete,
    onRemoveFromComparison,
    onCloseNegotiation,
    onCompare: _onCompare,
    onClearComparison: _onClearComparison,
    clearSelectedProperty: _clearSelectedProperty,
    refetchDocuments: _refetchDocuments,
    refresh,
    refreshing,
    librarySortKey,
    onLibrarySortChange,
    onFormSendForSignature,
    formsLibraryTotalCount: _formsLibraryTotalCount,
  } = nativeProps;

  const { t } = useLocalization();
  const { clients } = useAgentClients();

  const isDocumentsView = viewType === "documents";

  const documentsLoadingCombined = documentsLoadingState;

  const sortedDocumentsExcludingAgreements = useMemo(() => {
    const base = filterDocumentLibraryExcludingAgreements([
      ...(filteredDocuments as DocumentData[]),
    ]);
    const key = viewType === "documents" ? librarySortKey : "date_desc";
    return sortDocumentsForLibrary(base, key);
  }, [filteredDocuments, viewType, librarySortKey]);

  const [isClientSelectorOpen, setIsClientSelectorOpen] = useState(false);

  const handleRefresh = useCallback(() => {
    if (!refresh) return;
    void refresh();
  }, [refresh]);

  const isRefreshing = Boolean(refresh && refreshing);

  const selectedClientName = useMemo(() => {
    if (!isAgent) return null;
    if (!selectedClientId) {
      return t("client_selector.me", { defaultValue: "Me" });
    }
    const match = clients.find((client) => client.id === selectedClientId);
    return match?.name ?? t("client_selector.select_client", { defaultValue: "Select client" });
  }, [clients, isAgent, selectedClientId, t]);

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
          isAgent={isAgent}
          selectedClientName={selectedClientName}
          onOpenClientSelector={() => setIsClientSelectorOpen(true)}
          isDocumentsView={isDocumentsView}
          eventTypeFilter={eventTypeFilter}
          onEventTypeFilterChange={handleEventTypeFilterChange}
          onUploadDocument={isAgent ? () => setIsDocumentUploadModalOpen(true) : undefined}
          librarySortKey={librarySortKey}
          onLibrarySortChange={onLibrarySortChange}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          libraryViewMode={libraryViewMode}
          onLibraryViewModeChange={onLibraryViewModeChange}
          showLibraryViewToggle={showLibraryViewToggle}
        />

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

        {viewType === "forms-library" && isAgent && onFormSendForSignature ? (
          <FormsLibraryTab
            containerClass="w-full"
            formsGridClassName={
              libraryViewMode === "list"
                ? "gap-responsive-md flex w-full flex-col"
                : "gap-responsive-md grid w-full grid-cols-1 sm:grid-cols-2"
            }
            onSendForSignature={onFormSendForSignature}
            searchTerm={searchTerm}
            librarySortKey={librarySortKey}
            libraryViewMode={libraryViewMode}
          />
        ) : null}
      </ScrollView>
    </>
  );
}
