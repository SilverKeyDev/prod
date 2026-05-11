import { useCallback, useEffect, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import {
  useDocumentActions,
  useDocumentsDataIntegration,
  useFormsLibrary,
  useSavedPageDocumentHandlers,
  useSavedPageView,
} from "packages/features/documents";
import { useLibrarySortPreference } from "packages/features/saved/hooks/ui/useLibrarySortPreference";
import {
  type LibraryViewMode,
  useLibraryViewMode,
} from "packages/features/saved/hooks/ui/useLibraryViewMode";
import { useSavedFeatureSignatureFlow } from "packages/features/saved/hooks/useSavedFeatureSignatureFlow";
import type { SavedFeatureProps } from "packages/features/saved/types/savedFeatureProps";
import { useIsMobile, useSavedPageEffects, useSavedPageModals } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useAgentDashboardStore, useAuthStore, useUIStore } from "packages/store";
import { dateNow } from "packages/utils/date";
import { filterDocumentLibraryExcludingAgreements } from "packages/utils/documents";

import SavedHomesHeader from "./header/SavedHomesHeader";
import { SavedPageLayout } from "./layout/SavedPageLayout";
import { SavedFeatureSigningModals } from "./SavedFeatureSigningModals";

const EMPTY_HOME_SET = new Set<string>();

export function SavedFeature({ setMobileHeaderActions }: SavedFeatureProps) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { viewType, setViewType } = useSavedPageView();
  const selectedClientId = useAgentDashboardStore((s) => s.selectedClientId);
  const setSelectedClientId = useAgentDashboardStore((s) => s.setSelectedClientId);
  const [eventTypeFilter, setEventTypeFilter] = useState<
    "listed" | "price_change" | "sold" | "withdrawn" | ""
  >("");
  const [isDocumentUploadModalOpen, setIsDocumentUploadModalOpen] = useState(false);

  const documentsLibraryView = useLibraryViewMode("documents");
  const docusignLibraryView = useLibraryViewMode("docusign");
  const { setMode: setDocumentsLibraryMode } = documentsLibraryView;
  const { setMode: setDocusignLibraryMode } = docusignLibraryView;

  const documentsLibrarySort = useLibrarySortPreference("documents");
  const docusignLibrarySort = useLibrarySortPreference("docusign");

  const librarySortKey =
    viewType === "documents" || viewType === "forms-library"
      ? documentsLibrarySort.value
      : docusignLibrarySort.value;

  const onLibrarySortChange = useCallback(
    (value: string) => {
      if (viewType === "documents" || viewType === "forms-library") {
        documentsLibrarySort.setSort(value);
      } else docusignLibrarySort.setSort(value);
    },
    [viewType, documentsLibrarySort, docusignLibrarySort]
  );

  const libraryViewMode: LibraryViewMode =
    viewType === "documents" || viewType === "forms-library"
      ? documentsLibraryView.value
      : docusignLibraryView.value;

  const setLibraryViewMode = useCallback(
    (mode: LibraryViewMode) => {
      if (viewType === "documents" || viewType === "forms-library") {
        setDocumentsLibraryMode(mode);
      } else setDocusignLibraryMode(mode);
    },
    [viewType, setDocumentsLibraryMode, setDocusignLibraryMode]
  );

  const user = useAuthStore((s) => s.user);
  const isAgent = user?.is_agent ?? false;

  useEffect(() => {
    if (!isAgent && viewType === "forms-library") {
      setViewType("documents");
    }
  }, [isAgent, viewType, setViewType]);

  const { categories: formsLibraryCategories } = useFormsLibrary(isAgent);
  const formsLibraryTotalCount = useMemo(
    () => formsLibraryCategories.reduce((sum, c) => sum + c.forms.length, 0),
    [formsLibraryCategories]
  );

  const showLibraryViewToggle = true;
  const enqueueToast = useUIStore((s) => s.enqueueToast);

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
      log.debug(LOG_CATEGORIES.PAGES, "Library currentPdf updated", {
        currentPdf,
        currentDocumentId,
        currentDocumentName,
        timestamp: dateNow().toISOString(),
      });
    }
  }, [currentPdf, currentDocumentId, currentDocumentName]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    if (viewType === "documents" || viewType === "agreements") await refetchDocuments();
    else if (viewType === "forms-library") {
      await queryClient.invalidateQueries({ queryKey: queryKeys.formsLibrary.list() });
    }
    setRefreshing(false);
  }, [viewType, refetchDocuments, queryClient]);

  const documentsErrorForEffects: string | null =
    documentsErrorState != null ? String(documentsErrorState) : null;
  useSavedPageEffects({
    documentsError: documentsErrorForEffects,
  });

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

  const noopAsync = useCallback(async () => {}, []);
  const noop = useCallback(() => {}, []);

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
      isLoading={viewType === "forms-library" ? false : documentsLoadingState}
      homesCount={0}
      documentsCount={
        viewType === "documents"
          ? documentsTabCount
          : viewType === "agreements"
            ? agreementsTabCount
            : viewType === "forms-library"
              ? formsLibraryTotalCount
              : filteredDocuments.length
      }
      selectedClientId={selectedClientId}
      onClientChange={setSelectedClientId}
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
    searchTerm,
    viewType,
    refreshing,
    documentsLoadingState,
    documentsTabCount,
    agreementsTabCount,
    formsLibraryTotalCount,
    selectedClientId,
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
        selectedClientId={selectedClientId}
        setSelectedClientId={setSelectedClientId}
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
        filteredDocuments={filteredDocuments}
        loading={false}
        documentsLoadingState={documentsLoadingState}
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
        onToggleHomeSelection={noop}
        onUnlockHome={noopAsync}
        onDocumentDelete={(doc) => {
          void handleDocumentDelete(doc);
        }}
        onRemoveFromComparison={noop}
        onCloseNegotiation={handleCloseNegotiation}
        onCompare={noop}
        onClearComparison={noop}
        clearSelectedProperty={noop}
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
