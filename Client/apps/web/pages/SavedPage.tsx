import { useState, useCallback, useEffect, useMemo } from "react";

import PdfModal from "../components/modals/PdfModal";
import { useDocumentActions } from "../../../packages/hooks/data/documents/useDocumentActions";
import { usePropertyDetails } from "../../../packages/hooks/data/search/usePropertyDetails";
import { useSavedHomesStoreIntegration } from "../../../packages/hooks/store/search/useSavedHomesStoreIntegration";
import { useDocumentsDataIntegration } from "../../../packages/hooks/store/documents/useDocumentsDataIntegration";
import { useDocusignAgreements } from "../../../packages/hooks/data/documents/useDocusignAgreements";
import { useDocusignActions } from "../../../packages/hooks/data/documents/useDocusignActions";
import type { SavedHome } from "../../../packages/schemas";
import { useIsMobile } from "../../../packages/hooks/ui";
import { useHomeComparison } from "../../../packages/hooks/store/documents/useHomeComparison";
import { useSavedPageView } from "../../../packages/hooks/store/documents/useSavedPageView";
import { useAuthStore } from "../../../packages/store/auth.slice";
import { useUIStore } from "../../../packages/store";
import SavedHomesContent from "../components/saved/SavedHomesContent";
import SavedPageModals from "../components/saved/SavedPageModals";
import DocumentUploadModal from "../components/saved/DocumentUploadModal";
import SavedPageTabsAndSearch from "../components/saved/SavedPageTabsAndSearch";
import { ClientSelector, Button } from "../components/ui";
import { useSavedPageDocumentHandlers } from "../../../packages/hooks/data/documents/useSavedPageDocumentHandlers";
import { useSavedPageEffects } from "../../../packages/hooks/ui/documents/useSavedPageEffects";
import { useSavedPageModals } from "../../../packages/hooks/ui/documents/useSavedPageModals";
import { useSavedPageMobileHeader } from "../features/saved/hooks/useSavedPageMobileHeader";
import { CreateAgreementModal, AgreementDetailModal } from "../features/documents/docusign/modals";
import {
  convertSavedHomeToProperty,
  filterHomesBySearchTerm,
} from "../../../packages/utils/saved/savedHomeUtils";

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
  
  // DocuSign state
  const [isCreateAgreementModalOpen, setIsCreateAgreementModalOpen] = useState(false);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  
  // Document upload modal state
  const [isDocumentUploadModalOpen, setIsDocumentUploadModalOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isAgent = user?.is_agent ?? false;
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  // Use Zustand store for saved homes data (React Query integration)
  const {
    savedHomes: homes,
    savedHomesLoading: loading,
    savedHomesError: error,
    refreshSavedHomes,
  } = useSavedHomesStoreIntegration(selectedClientId ?? undefined);

  // Use centralized document actions for documents - this instance manages the modal state
  const {
    currentPdf,
    currentDocumentId,
    currentDocumentName,
    closePdfModal,
    handleViewDocument,
    handleDownloadDocument,
    handleShareDocument,
  } = useDocumentActions();

  // Use DocuSign hooks
  const {
    agreements,
    isLoading: agreementsLoading,
    error: agreementsError,
    refetchAgreements,
  } = useDocusignAgreements();

  const {
    sendAgreement,
    voidAgreement,
  } = useDocusignActions();

  // Use documents data integration for documents tab
  // Pass handlers from the same useDocumentActions instance to ensure modal state is shared
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

  // Use property details hook for unlock functionality
  const {
    selectedProperty,
    fetchPropertyDetails,
    clearSelectedProperty,
    isLoading: isLoadingPropertyDetails,
  } = usePropertyDetails();

  // Use comparison hook
  const {
    selectedHomesForComparison,
    selectedHomesData,
    handleToggleHomeSelection,
    handleRemoveFromComparison,
    handleClearComparison,
  } = useHomeComparison(homes);

  // Use modals hook
  const {
    isCompareModalOpen,
    setIsCompareModalOpen,
    isNegotiationModalOpen,
    selectedHomeForNegotiation,
    handleOpenNegotiation,
    handleCloseNegotiation,
  } = useSavedPageModals();

  // Use document handlers hook
  const {
    handleDocumentDelete,
  } = useSavedPageDocumentHandlers({
    handleViewDocument,
    handleDownloadDocument,
    handleShareDocument,
    handleDelete,
    documents,
  });

  // Debug: Log when currentPdf changes to verify state updates
  useEffect(() => {
    if (currentPdf) {
      console.log("[SavedPage] currentPdf updated", {
        currentPdf,
        currentDocumentId,
        currentDocumentName,
        timestamp: new Date().toISOString(),
      });
    }
  }, [currentPdf, currentDocumentId, currentDocumentName]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    if (viewType === "homes") {
      await refreshSavedHomes();
    } else if (viewType === "documents") {
      await Promise.all([refetchDocuments(), refetchAgreements()]);
    }
    setRefreshing(false);
  }, [viewType, refreshSavedHomes, refetchDocuments, refetchAgreements]);

  // DocuSign handlers
  const handleAgreementClick = useCallback((agreementId: string) => {
    setSelectedAgreementId(agreementId);
  }, []);

  const handleAgreementSend = useCallback(async (agreementId: string) => {
    try {
      await sendAgreement({
        agreementId,
        signingMethod: "embedded",
      });
      enqueueToast({
        type: "success",
        message: "Agreement sent for signature",
      });
      await refetchAgreements();
    } catch (error) {
      enqueueToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to send agreement",
      });
    }
  }, [sendAgreement, refetchAgreements, enqueueToast]);

  const handleAgreementVoid = useCallback(async (agreementId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to void this agreement? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await voidAgreement({
        agreementId,
        reason: "Voided from SavedPage",
      });
      enqueueToast({
        type: "success",
        message: "Agreement voided successfully",
      });
      await refetchAgreements();
    } catch (error) {
      enqueueToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to void agreement",
      });
    }
  }, [voidAgreement, refetchAgreements, enqueueToast]);

  const handleCreateAgreementSuccess = useCallback(
    (agreementId: string) => {
      refetchAgreements();
      setSelectedAgreementId(agreementId);
    },
    [refetchAgreements]
  );

  // Use effects hook
  useSavedPageEffects({
    viewType,
    refreshSavedHomes,
    error,
    documentsError: documentsErrorState || agreementsError || null,
  });

  const filteredHomes = filterHomesBySearchTerm(homes, searchTerm);

  // Filter documents by event type if filter is set
  const filteredDocuments = useMemo(() => {
    if (eventTypeFilter === "") {
      return documents;
    }
    return documents.filter(
      (doc) => doc.event_type === eventTypeFilter,
    );
  }, [documents, eventTypeFilter]);

  // Handle unlocking a home - opens PropertyDetailsModal
  const handleUnlockHome = useCallback(
    async (home: SavedHome) => {
      const propertyData = convertSavedHomeToProperty(home);
      await fetchPropertyDetails(propertyData);
    },
    [fetchPropertyDetails]
  );

  // Use mobile header hook
  useSavedPageMobileHeader({
    isMobile,
    setMobileHeaderActions,
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

  const handleCompare = useCallback(() => {
    if (selectedHomesData.length >= 2) {
      setIsCompareModalOpen(true);
    }
  }, [selectedHomesData.length, setIsCompareModalOpen]);

  return (
    <div>
      <PdfModal
        currentPdf={currentPdf}
        currentReportAddress={currentDocumentName}
        reportId={currentDocumentId}
        onClose={closePdfModal}
      />
      <div
        className={`${isMobile ? "mt-0" : "mt-0 lg:mt-0"} space-y-responsive-lg ${
          viewType === "homes" && selectedHomesData.length >= 1
            ? "mb-[140px] sm:mb-[160px]"
            : "mb-responsive-lg"
        }`}
      >
        {/* Header - Only show on desktop (mobile shows in topbar) */}
        {!isMobile && (
          <>
            <div className="mb-4 w-full px-4 sm:px-6">
              <div className="mx-auto max-w-5xl">
                <ClientSelector
                  selectedClientId={selectedClientId}
                  onClientChange={setSelectedClientId}
                />
              </div>
            </div>
            <div className="w-full px-4 sm:px-6">
              <div className="mx-auto max-w-5xl">
                <SavedPageTabsAndSearch
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  searchPlaceholder={
                    viewType === "homes"
                      ? "Search saved homes..."
                      : viewType === "documents"
                        ? "Search documents..."
                        : "Filter by address"
                  }
                  viewType={viewType}
                  onViewTypeChange={setViewType}
                  eventTypeFilter={eventTypeFilter}
                  onEventTypeFilterChange={setEventTypeFilter}
                  rightText={
                    viewType === "homes"
                      ? `${filteredHomes.length} saved`
                      : viewType === "documents"
                        ? `${filteredDocuments.length} documents`
                        : ""
                  }
                  onUploadClick={() => setIsDocumentUploadModalOpen(true)}
                />
              </div>
            </div>
          </>
        )}

        {/* Create Agreement - Only show when viewing documents */}
        {viewType === "documents" && isAgent && (
          <div className="w-full px-4 sm:px-6 mb-4">
            <div className="mx-auto max-w-5xl">
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsCreateAgreementModalOpen(true)}
              >
                Create Agreement
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <SavedHomesContent
          viewType={viewType}
          filteredHomes={filteredHomes}
          homesLoading={loading}
          documents={filteredDocuments}
          documentsLoading={documentsLoadingState}
          agreements={agreements}
          agreementsLoading={agreementsLoading}
          selectedHomesForComparison={selectedHomesForComparison}
          onToggleHomeSelection={handleToggleHomeSelection}
          onUnlockHome={handleUnlockHome}
          onOpenNegotiation={handleOpenNegotiation}
          onDocumentDelete={handleDocumentDelete}
          onAgreementClick={handleAgreementClick}
          onAgreementSend={handleAgreementSend}
          onAgreementVoid={handleAgreementVoid}
          selectedHomesDataLength={selectedHomesData.length}
        />

        {/* Modals */}
        <SavedPageModals
          viewType={viewType}
          selectedProperty={selectedProperty}
          clearSelectedProperty={clearSelectedProperty}
          isLoadingPropertyDetails={isLoadingPropertyDetails}
          isCompareModalOpen={isCompareModalOpen}
          setIsCompareModalOpen={setIsCompareModalOpen}
          selectedHomesData={selectedHomesData}
          handleRemoveFromComparison={handleRemoveFromComparison}
          handleToggleHomeSelection={handleToggleHomeSelection}
          homes={homes}
          isNegotiationModalOpen={isNegotiationModalOpen}
          selectedHomeForNegotiation={selectedHomeForNegotiation}
          handleCloseNegotiation={handleCloseNegotiation}
          handleCompare={handleCompare}
          handleClearComparison={handleClearComparison}
        />

        {/* Document Upload Modal */}
        <DocumentUploadModal
          isOpen={isDocumentUploadModalOpen}
          onClose={() => setIsDocumentUploadModalOpen(false)}
          onUploadSuccess={refetchDocuments}
        />

        {/* DocuSign Modals */}
        {isAgent && (
          <CreateAgreementModal
            isOpen={isCreateAgreementModalOpen}
            onClose={() => setIsCreateAgreementModalOpen(false)}
            preselectedBuyerId={selectedClientId ?? undefined}
            onSuccess={handleCreateAgreementSuccess}
          />
        )}
        <AgreementDetailModal
          agreementId={selectedAgreementId}
          isOpen={!!selectedAgreementId}
          onClose={() => setSelectedAgreementId(null)}
        />
      </div>
    </div>
  );
}
