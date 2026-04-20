import { useCallback, useEffect, useMemo, useState } from "react";

import {
  useDocumentActions,
  useDocumentsDataIntegration,
  useHomeComparison,
  useSavedPageDocumentHandlers,
  useSavedPageView,
} from "packages/features/documents";
import { useSavedFeatureSignatureFlow } from "packages/features/saved/hooks/useSavedFeatureSignatureFlow";
import type { SavedFeatureProps } from "packages/features/saved/types/savedFeatureProps";
import { filterHomesBySearchTerm } from "packages/features/saved/types/savedHomeUtils";
import { usePropertyDetails } from "packages/features/search";
import { useIsMobile, useSavedPageEffects, useSavedPageModals } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNavigation } from "packages/navigation";
import {
  useAgentDashboardStore,
  useAuthStore,
  useSavedHomesStore,
  useUIStore,
} from "packages/store";
import type { SavedHome } from "packages/types";
import { dateNow } from "packages/utils/date";
import { filterDocumentLibraryExcludingAgreements } from "packages/utils/documents";
import { buildPropertyUrl } from "packages/utils/property/slug";

import SavedHomesHeader from "./header/SavedHomesHeader";
import { SavedPageLayout } from "./layout/SavedPageLayout";
import { SavedFeatureSigningModals } from "./SavedFeatureSigningModals";

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
  const enqueueToast = useUIStore((s) => s.enqueueToast);

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

  const documentHandlers = useMemo(
    () => ({
      handleViewDocument,
      handleDownloadDocument,
      handleShareDocument,
    }),
    [handleViewDocument, handleDownloadDocument, handleShareDocument]
  );

  const {
    documents,
    documentsLoading: documentsLoadingState,
    documentsError: documentsErrorState,
    refetchDocuments,
    handleViewDocument: documentListView,
    handleDownloadDocument: documentListDownload,
    handleShareDocument: documentListShare,
    handleDelete,
    isSendingForSignature,
    sendDocumentForSignature,
    signAgreementNow,
    getDefaultAgreementTitle,
    sendForSignatureDisabledReason,
    agreementSigningSession,
    dismissAgreementSigning,
    viewSignedAgreement,
    dismissViewSignedAgreement,
    openViewSignedAgreement,
    onAgreementSigningComplete,
  } = useDocumentsDataIntegration(selectedClientId ?? undefined, documentHandlers);

  const {
    isSendForSignatureModalOpen,
    sendForSignatureTitle,
    setSendForSignatureTitle,
    sendForSignatureRecipientClientId,
    setSendForSignatureRecipientClientId,
    sendForSignatureDocument,
    openSendForSignatureModal,
    openSendForSignatureModalForForm,
    closeSendForSignatureModal,
    submitSendForSignature,
    sendForSignatureDirect,
    signNowDirect,
  } = useSavedFeatureSignatureFlow(documents, selectedClientId, enqueueToast, {
    sendDocumentForSignature,
    getDefaultAgreementTitle,
    sendForSignatureDisabledReason,
    refetchDocuments,
    signAgreementNow,
  });

  const {
    selectedProperty,
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
    handleViewDocument: documentListView,
    handleDownloadDocument: documentListDownload,
    handleShareDocument: documentListShare,
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
    else if (viewType === "documents" || viewType === "agreements") await refetchDocuments();
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

  const documentsTabCount = useMemo(
    () => filterDocumentLibraryExcludingAgreements(filteredDocuments).length,
    [filteredDocuments]
  );
  const agreementsTabCount = useMemo(
    () => filteredDocuments.filter((d) => d.library_kind === "agreement").length,
    [filteredDocuments]
  );

  const { navigateToPath } = useNavigation();

  const handleUnlockHome = useCallback(
    async (home: SavedHome) => {
      const zpid = home.home_id;
      const address = typeof home.address === "string" ? home.address : (home.description ?? "");
      navigateToPath(buildPropertyUrl(zpid, address));
    },
    [navigateToPath]
  );

  // Render mobile header directly in parent instead of via effect
  // This avoids the infinite loop caused by effect → state update → re-render → effect
  const mobileHeader = isMobile ? (
    <SavedHomesHeader
      isMobile={true}
      isAgent={isAgent}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      viewType={viewType}
      onViewTypeChange={setViewType}
      onRefresh={refresh}
      isRefreshing={refreshing}
      isLoading={viewType === "homes" ? loading : documentsLoadingState}
      homesCount={filteredHomes.length}
      documentsCount={
        viewType === "documents"
          ? documentsTabCount
          : viewType === "agreements"
            ? agreementsTabCount
            : filteredDocuments.length
      }
      selectedClientId={selectedClientId}
      onClientChange={setSelectedClientId}
      eventTypeFilter={eventTypeFilter}
      onEventTypeFilterChange={setEventTypeFilter}
    />
  ) : null;

  // Set mobile header once on mount and when it changes, but avoid effect loop
  useEffect(() => {
    setMobileHeaderActions?.(mobileHeader);
    return () => {
      setMobileHeaderActions?.(null);
    };
    // Only depend on whether we have a header to set, not the header itself
    // This breaks the loop since mobileHeader JSX creates new objects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isMobile,
    setMobileHeaderActions,
    // Depend on primitive values that determine if header should update
    isAgent,
    searchTerm,
    viewType,
    refreshing,
    loading,
    documentsLoadingState,
    filteredHomes.length,
    documentsTabCount,
    agreementsTabCount,
    selectedClientId,
    eventTypeFilter,
  ]);

  const handleCompare = useCallback(() => {
    if (selectedHomesData.length >= 2) setIsCompareModalOpen(true);
  }, [selectedHomesData.length, setIsCompareModalOpen]);

  return (
    <>
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
        onViewDocument={documentListView}
        onDownloadDocument={documentListDownload}
        onShareDocument={documentListShare}
        onSendForSignature={
          isAgent ? (isMobile ? sendForSignatureDirect : openSendForSignatureModal) : undefined
        }
        onFormSendForSignature={isAgent ? openSendForSignatureModalForForm : undefined}
        onSignNow={signNowDirect}
        onViewSignedAgreement={openViewSignedAgreement}
        sendForSignatureModal={
          isAgent && !isMobile
            ? {
                isOpen: isSendForSignatureModalOpen,
                title: sendForSignatureTitle,
                recipientClientId: sendForSignatureRecipientClientId,
                isSubmitting: isSendingForSignature,
                disabledReason:
                  sendForSignatureDocument != null
                    ? sendForSignatureDisabledReason(sendForSignatureDocument)
                    : null,
                onTitleChange: setSendForSignatureTitle,
                onRecipientClientChange: setSendForSignatureRecipientClientId,
                onClose: closeSendForSignatureModal,
                onConfirm: () => {
                  void submitSendForSignature();
                },
              }
            : undefined
        }
        onToggleHomeSelection={handleToggleHomeSelection}
        onUnlockHome={handleUnlockHome}
        onDocumentDelete={(doc) => {
          void handleDocumentDelete(doc);
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
      <SavedFeatureSigningModals
        agreementSigningSession={agreementSigningSession}
        onDismissAgreementSigning={dismissAgreementSigning}
        onAgreementSigningComplete={onAgreementSigningComplete}
        viewSignedAgreement={viewSignedAgreement}
        onDismissViewSignedAgreement={dismissViewSignedAgreement}
      />
    </>
  );
}
