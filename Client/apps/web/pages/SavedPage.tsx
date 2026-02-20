import { useCallback, useEffect, useMemo, useState } from "react";

import { useDocumentActions } from "packages/hooks/data/documents/useDocumentActions";
import { useDocusignActions } from "packages/hooks/data/documents/useDocusignActions";
import { useDocusignAgreements } from "packages/hooks/data/documents/useDocusignAgreements";
import { useSavedPageDocumentHandlers } from "packages/hooks/data/documents/useSavedPageDocumentHandlers";
import { usePropertyDetails } from "packages/hooks/data/search/property/usePropertyDetails";
import { useDocumentsDataIntegration } from "packages/hooks/store/documents/useDocumentsDataIntegration";
import { useHomeComparison } from "packages/hooks/store/documents/useHomeComparison";
import { useSavedPageView } from "packages/hooks/store/documents/useSavedPageView";
import { useSavedHomesStoreIntegration } from "packages/hooks/store/search/useSavedHomesStoreIntegration";
import {
  useIsMobile,
  useSavedHomesDocuSign,
  useSavedPageEffects,
  useSavedPageModals,
} from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { SavedHome } from "packages/schemas";
import { useAuthStore } from "packages/store";
import { useUIStore } from "packages/store";
import { dateNow } from "packages/utils/core/date";
import {
  convertSavedHomeToProperty,
  filterHomesBySearchTerm,
} from "packages/utils/domain/saved/savedHomeUtils";

import SavedHomesHeader from "@/components/saved/SavedHomesHeader";
import { useSavedPageMobileHeader } from "@/features/saved/hooks/useSavedPageMobileHeader";

import { SavedPageLayout } from "./SavedPageLayout";

type SavedHomesProps = {
  setMobileHeaderActions?: React.Dispatch<
    React.SetStateAction<React.ReactNode | null>
  >;
};

export default function SavedHomes({
  setMobileHeaderActions,
}: SavedHomesProps) {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { viewType, setViewType } = useSavedPageView();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<
    "listed" | "price_change" | "sold" | "withdrawn" | ""
  >("");
  const [isDocumentUploadModalOpen, setIsDocumentUploadModalOpen] =
    useState(false);
  const user = useAuthStore((s) => s.user);
  const isAgent = user?.is_agent ?? false;
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  const {
    savedHomes: homes,
    savedHomesLoading: loading,
    savedHomesError: error,
    refreshSavedHomes,
  } = useSavedHomesStoreIntegration(selectedClientId ?? undefined);
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
    agreements,
    isLoading: agreementsLoading,
    error: agreementsError,
    refetchAgreements,
  } = useDocusignAgreements();
  const { sendAgreement, voidAgreement } = useDocusignActions();
  const {
    isCreateAgreementModalOpen,
    setIsCreateAgreementModalOpen,
    selectedAgreementId,
    setSelectedAgreementId,
    handleAgreementClick,
    handleAgreementSend,
    handleAgreementVoid,
    handleCreateAgreementSuccess,
  } = useSavedHomesDocuSign(
    sendAgreement,
    voidAgreement,
    refetchAgreements,
    enqueueToast,
  );
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
    handleOpenNegotiation,
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
    else if (viewType === "documents")
      await Promise.all([refetchDocuments(), refetchAgreements()]);
    setRefreshing(false);
  }, [viewType, refreshSavedHomes, refetchDocuments, refetchAgreements]);

  useSavedPageEffects({
    viewType,
    refreshSavedHomes,
    error,
    documentsError: documentsErrorState || agreementsError || null,
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
    [fetchPropertyDetails],
  );

  const headerProps = useSavedPageMobileHeader({
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
    () =>
      isMobile && setMobileHeaderActions ? (
        <SavedHomesHeader {...headerProps} />
      ) : null,
    [isMobile, setMobileHeaderActions, headerProps],
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
      agreements={agreements}
      agreementsLoading={agreementsLoading}
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
      isCreateAgreementModalOpen={isCreateAgreementModalOpen}
      setIsCreateAgreementModalOpen={setIsCreateAgreementModalOpen}
      selectedAgreementId={selectedAgreementId}
      setSelectedAgreementId={setSelectedAgreementId}
      isAgent={isAgent}
      homes={homes}
      currentPdf={currentPdf}
      currentDocumentId={currentDocumentId}
      currentDocumentName={currentDocumentName}
      closePdfModal={closePdfModal}
      onToggleHomeSelection={handleToggleHomeSelection}
      onUnlockHome={handleUnlockHome}
      onOpenNegotiation={handleOpenNegotiation}
      onDocumentDelete={handleDocumentDelete}
      onAgreementClick={handleAgreementClick}
      onAgreementSend={handleAgreementSend}
      onAgreementVoid={handleAgreementVoid}
      onRemoveFromComparison={handleRemoveFromComparison}
      onCloseNegotiation={handleCloseNegotiation}
      onCompare={handleCompare}
      onClearComparison={handleClearComparison}
      clearSelectedProperty={clearSelectedProperty}
      refetchDocuments={refetchDocuments}
      onCreateAgreementSuccess={handleCreateAgreementSuccess}
    />
  );
}
