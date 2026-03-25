import { useCallback, useEffect, useMemo, useState } from "react";

import {
  useDocumentActions,
  useDocumentsDataIntegration,
  useHomeComparison,
  useSavedPageDocumentHandlers,
  useSavedPageView,
} from "packages/features/documents";
import { useSavedPageMobileHeader } from "packages/features/saved/hooks/data/useSavedPageMobileHeader";
import {
  convertSavedHomeToProperty,
  filterHomesBySearchTerm,
} from "packages/features/saved/types/savedHomeUtils";
import { usePropertyDetails } from "packages/features/search";
import { useIsMobile, useSavedPageEffects, useSavedPageModals } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useAgentDashboardStore, useAuthStore, useSavedHomesStore } from "packages/store";
import type { SavedHome } from "packages/types";
import { dateNow } from "packages/utils/date";

import SavedHomesHeader from "./header/SavedHomesHeader";
import { SavedPageLayout } from "./layout/SavedPageLayout";

type SavedFeatureProps = {
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
};

export function SavedFeature({ setMobileHeaderActions }: SavedFeatureProps) {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { viewType, setViewType } = useSavedPageView();
  const selectedClientId = useAgentDashboardStore((s) => s.selectedClientId);
  const setSelectedClientId = useAgentDashboardStore((s) => s.setSelectedClientId);
  const [eventTypeFilter, setEventTypeFilter] = useState<
    "listed" | "price_change" | "sold" | "withdrawn" | ""
  >("");
  const [isDocumentUploadModalOpen, setIsDocumentUploadModalOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isAgent = user?.is_agent ?? false;

  const homes = useSavedHomesStore((s) => s.savedHomes);
  const loading = useSavedHomesStore((s) => s.savedHomesLoading);
  const error = useSavedHomesStore((s) => s.savedHomesError);
  const refreshSavedHomes = useSavedHomesStore((s) => s.refreshSavedHomes);
  const {
    currentPdf,
    currentDocumentId,
    currentDocumentName,
    closePdfModal,
    handleViewDocument,
    handleDownloadDocument,
    handleShareDocument,
  } = useDocumentActions();
  const {
    documents,
    documentsLoading: documentsLoadingState,
    documentsError: documentsErrorState,
    refetchDocuments,
    handleDelete,
  } = useDocumentsDataIntegration(selectedClientId ?? undefined, {
    handleViewDocument,
    handleDownloadDocument,
    handleShareDocument,
  });
  const {
    selectedProperty,
    fetchPropertyDetails,
    clearSelectedProperty,
    isLoading: isLoadingPropertyDetails,
  } = usePropertyDetails();
  const {
    selectedHomesForComparison,
    selectedHomesData,
    handleToggleHomeSelection,
    handleRemoveFromComparison,
    handleClearComparison,
  } = useHomeComparison(homes);
  const {
    isCompareModalOpen,
    setIsCompareModalOpen,
    isNegotiationModalOpen,
    selectedHomeForNegotiation,
    handleCloseNegotiation,
  } = useSavedPageModals();
  const { handleDocumentDelete } = useSavedPageDocumentHandlers({
    handleViewDocument,
    handleDownloadDocument,
    handleShareDocument,
    handleDelete,
    documents,
  });

  useEffect(() => {
    if (currentPdf) {
      log.debug(LOG_CATEGORIES.PAGES, "SavedPage currentPdf updated", {
        currentPdf,
        currentDocumentId,
        currentDocumentName,
        timestamp: dateNow().toISOString(),
      });
    }
  }, [currentPdf, currentDocumentId, currentDocumentName]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    if (viewType === "homes") await refreshSavedHomes();
    else if (viewType === "documents") await refetchDocuments();
    setRefreshing(false);
  }, [viewType, refreshSavedHomes, refetchDocuments]);

  const documentsErrorForEffects: string | null =
    documentsErrorState != null ? String(documentsErrorState) : null;
  useSavedPageEffects({
    viewType,
    refreshSavedHomes,
    error,
    documentsError: documentsErrorForEffects,
  });

  const filteredHomes = filterHomesBySearchTerm(homes, searchTerm);
  const filteredDocuments = useMemo(() => {
    if (eventTypeFilter === "") return documents;
    return documents.filter((doc) => doc.event_type === eventTypeFilter);
  }, [documents, eventTypeFilter]);

  const handleUnlockHome = useCallback(
    async (home: SavedHome) => {
      await fetchPropertyDetails(convertSavedHomeToProperty(home));
    },
    [fetchPropertyDetails]
  );

  const headerProps = useSavedPageMobileHeader({
    isAgent,
    searchTerm,
    setSearchTerm,
    viewType,
    setViewType,
    refresh,
    refreshing,
    loading,
    documentsLoadingState,
    filteredHomesLength: filteredHomes.length,
    documentsLength: filteredDocuments.length,
    selectedClientId,
    setSelectedClientId,
    eventTypeFilter,
    setEventTypeFilter,
  });

  const mobileHeaderNode = useMemo(
    () => (isMobile && setMobileHeaderActions ? <SavedHomesHeader {...headerProps} /> : null),
    [isMobile, setMobileHeaderActions, headerProps]
  );

  useEffect(() => {
    setMobileHeaderActions?.(mobileHeaderNode ?? null);
    return () => setMobileHeaderActions?.(null);
  }, [mobileHeaderNode, setMobileHeaderActions]);

  const handleCompare = useCallback(() => {
    if (selectedHomesData.length >= 2) setIsCompareModalOpen(true);
  }, [selectedHomesData.length, setIsCompareModalOpen]);

  return (
    <SavedPageLayout
      isMobile={isMobile}
      viewType={viewType}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      selectedClientId={selectedClientId}
      setSelectedClientId={setSelectedClientId}
      eventTypeFilter={eventTypeFilter}
      setEventTypeFilter={setEventTypeFilter}
      setViewType={setViewType}
      filteredHomes={filteredHomes}
      filteredDocuments={filteredDocuments}
      loading={loading}
      documentsLoadingState={documentsLoadingState}
      selectedHomesForComparison={selectedHomesForComparison}
      selectedHomesData={selectedHomesData}
      selectedProperty={selectedProperty}
      isLoadingPropertyDetails={isLoadingPropertyDetails}
      isCompareModalOpen={isCompareModalOpen}
      setIsCompareModalOpen={setIsCompareModalOpen}
      isNegotiationModalOpen={isNegotiationModalOpen}
      selectedHomeForNegotiation={selectedHomeForNegotiation}
      isDocumentUploadModalOpen={isDocumentUploadModalOpen}
      setIsDocumentUploadModalOpen={setIsDocumentUploadModalOpen}
      isAgent={isAgent}
      homes={homes}
      currentPdf={currentPdf}
      currentDocumentId={currentDocumentId}
      currentDocumentName={currentDocumentName}
      closePdfModal={closePdfModal}
      onViewDocument={handleViewDocument}
      onDownloadDocument={handleDownloadDocument}
      onShareDocument={handleShareDocument}
      onToggleHomeSelection={handleToggleHomeSelection}
      onUnlockHome={handleUnlockHome}
      onDocumentDelete={(docId) => {
        const doc = documents.find((d) => d.id === docId);
        if (doc) void handleDocumentDelete(doc);
      }}
      onRemoveFromComparison={handleRemoveFromComparison}
      onCloseNegotiation={handleCloseNegotiation}
      onCompare={handleCompare}
      onClearComparison={handleClearComparison}
      clearSelectedProperty={clearSelectedProperty}
      refetchDocuments={refetchDocuments}
      refresh={refresh}
      refreshing={refreshing}
    />
  );
}
