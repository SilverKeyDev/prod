import { useCallback, useEffect, useMemo, useState } from "react";

import { useFormsLibrary, useSavedPageView } from "packages/features/documents";
import { useSavedLibraryChrome } from "packages/features/saved/hooks/ui/useSavedLibraryChrome";
import { useSavedDocumentsCoordinator } from "packages/features/saved/hooks/useSavedDocumentsCoordinator";
import type { SavedFeatureProps } from "packages/features/saved/types/savedFeatureProps";
import { useIsMobile, useSavedPageEffects, useSavedPageModals } from "packages/hooks/ui";
import { useAgentDashboardStore, useAuthStore, useWorkspaceStore } from "packages/store";

import SavedHomesHeader from "./header/SavedHomesHeader";
import { SavedPageLayout } from "./layout/SavedPageLayout";
import { SavedFeatureSigningModals } from "./SavedFeatureSigningModals";

const EMPTY_HOME_SET = new Set<string>();

export function SavedFeature({ setMobileHeaderActions }: SavedFeatureProps) {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { viewType, setViewType } = useSavedPageView();
  const selectedClientId = useAgentDashboardStore((s) => s.selectedClientId);
  const setSelectedClientId = useAgentDashboardStore((s) => s.setSelectedClientId);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<
    "listed" | "price_change" | "sold" | "withdrawn" | ""
  >("");
  const [isDocumentUploadModalOpen, setIsDocumentUploadModalOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const isAgent = (user?.roles ?? []).includes("agent");
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const isBrokerageWorkspace = activeWorkspace === "brokerage";

  const libraryChrome = useSavedLibraryChrome(viewType, setViewType, isAgent);
  const {
    librarySortKey,
    onLibrarySortChange,
    libraryViewMode,
    setLibraryViewMode,
    showLibraryViewToggle,
  } = libraryChrome;

  const { categories: formsLibraryCategories } = useFormsLibrary(isAgent);
  const formsLibraryTotalCount = useMemo(
    () => formsLibraryCategories.reduce((sum, c) => sum + c.forms.length, 0),
    [formsLibraryCategories]
  );

  // In brokerage workspace, scope documents by selectedAgentId instead of selectedClientId
  const docs = useSavedDocumentsCoordinator(
    isBrokerageWorkspace ? selectedAgentId : selectedClientId,
    viewType,
    eventTypeFilter
  );

  const {
    isCompareModalOpen,
    setIsCompareModalOpen,
    isNegotiationModalOpen,
    selectedHomeForNegotiation,
    handleCloseNegotiation,
  } = useSavedPageModals();

  useSavedPageEffects({
    documentsError: docs.documentsErrorForEffects,
  });

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await docs.refresh();
    setRefreshing(false);
  }, [docs]);

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
  } = docs.signatureFlow;

  const noopAsync = useCallback(async () => {}, []);
  const noop = useCallback(() => {}, []);

  const mobileHeader = isMobile ? (
    <SavedHomesHeader
      isMobile={true}
      isAgent={isAgent}
      isBrokerageWorkspace={isBrokerageWorkspace}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      viewType={viewType}
      onViewTypeChange={setViewType}
      onRefresh={refresh}
      isRefreshing={refreshing}
      isLoading={viewType === "forms-library" ? false : docs.documentsLoadingState}
      homesCount={0}
      documentsCount={
        viewType === "documents"
          ? docs.documentsTabCount
          : viewType === "agreements"
            ? docs.agreementsTabCount
            : viewType === "forms-library"
              ? formsLibraryTotalCount
              : docs.filteredDocuments.length
      }
      selectedClientId={selectedClientId}
      onClientChange={setSelectedClientId}
      selectedAgentId={selectedAgentId}
      onAgentChange={setSelectedAgentId}
      eventTypeFilter={eventTypeFilter}
      onEventTypeFilterChange={setEventTypeFilter}
      libraryViewMode={libraryViewMode}
      onLibraryViewModeChange={setLibraryViewMode}
      showLibraryViewToggle={showLibraryViewToggle}
      librarySortKey={librarySortKey}
      onLibrarySortChange={onLibrarySortChange}
    />
  ) : null;

  useEffect(() => {
    setMobileHeaderActions?.(mobileHeader);
    return () => {
      setMobileHeaderActions?.(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isMobile,
    setMobileHeaderActions,
    isAgent,
    isBrokerageWorkspace,
    searchTerm,
    viewType,
    refreshing,
    docs.documentsLoadingState,
    docs.documentsTabCount,
    docs.agreementsTabCount,
    formsLibraryTotalCount,
    selectedClientId,
    selectedAgentId,
    eventTypeFilter,
    libraryViewMode,
    showLibraryViewToggle,
    librarySortKey,
  ]);

  return (
    <>
      <SavedPageLayout
        isMobile={isMobile}
        viewType={viewType}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedClientId={isBrokerageWorkspace ? selectedAgentId : selectedClientId}
        setSelectedClientId={isBrokerageWorkspace ? setSelectedAgentId : setSelectedClientId}
        eventTypeFilter={eventTypeFilter}
        setEventTypeFilter={setEventTypeFilter}
        setViewType={setViewType}
        libraryViewMode={libraryViewMode}
        onLibraryViewModeChange={setLibraryViewMode}
        showLibraryViewToggle={showLibraryViewToggle}
        librarySortKey={librarySortKey}
        onLibrarySortChange={onLibrarySortChange}
        formsLibraryTotalCount={formsLibraryTotalCount}
        filteredHomes={[]}
        filteredDocuments={docs.filteredDocuments}
        loading={false}
        documentsLoadingState={docs.documentsLoadingState}
        selectedHomesForComparison={EMPTY_HOME_SET}
        selectedHomesData={[]}
        selectedProperty={null}
        isLoadingPropertyDetails={false}
        isCompareModalOpen={isCompareModalOpen}
        setIsCompareModalOpen={setIsCompareModalOpen}
        isNegotiationModalOpen={isNegotiationModalOpen}
        selectedHomeForNegotiation={selectedHomeForNegotiation}
        isDocumentUploadModalOpen={isDocumentUploadModalOpen}
        setIsDocumentUploadModalOpen={setIsDocumentUploadModalOpen}
        isAgent={isAgent}
        homes={[]}
        currentPdf={docs.currentPdf}
        currentDocumentId={docs.currentDocumentId}
        currentDocumentName={docs.currentDocumentName}
        closePdfModal={docs.closePdfModal}
        onViewDocument={docs.documentListView}
        onDownloadDocument={docs.documentListDownload}
        onShareDocument={docs.documentListShare}
        onSendForSignature={
          isAgent ? (isMobile ? sendForSignatureDirect : openSendForSignatureModal) : undefined
        }
        onFormSendForSignature={isAgent ? openSendForSignatureModalForForm : undefined}
        onSignNow={signNowDirect}
        onViewSignedAgreement={docs.openViewSignedAgreement}
        sendForSignatureModal={
          isAgent && !isMobile
            ? {
                isOpen: isSendForSignatureModalOpen,
                title: sendForSignatureTitle,
                recipientClientId: sendForSignatureRecipientClientId,
                isSubmitting: docs.isSendingForSignature,
                disabledReason:
                  sendForSignatureDocument != null
                    ? docs.sendForSignatureDisabledReason(sendForSignatureDocument)
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
        onToggleHomeSelection={noop}
        onUnlockHome={noopAsync}
        onDocumentDelete={(doc) => {
          void docs.handleDocumentDelete(doc);
        }}
        onRemoveFromComparison={noop}
        onCloseNegotiation={handleCloseNegotiation}
        onCompare={noop}
        onClearComparison={noop}
        clearSelectedProperty={noop}
        refetchDocuments={docs.refetchDocuments}
        refresh={refresh}
        refreshing={refreshing}
      />
      <SavedFeatureSigningModals
        agreementSigningSession={docs.agreementSigningSession}
        onDismissAgreementSigning={docs.dismissAgreementSigning}
        onAgreementSigningComplete={docs.onAgreementSigningComplete}
        viewSignedAgreement={docs.viewSignedAgreement}
        onDismissViewSignedAgreement={docs.dismissViewSignedAgreement}
      />
    </>
  );
}