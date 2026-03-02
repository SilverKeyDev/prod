import {
  type Agreement,
  AgreementDetailModal,
  CreateAgreementModal,
  type DocumentData,
} from "packages/features/documents";
import type { SavedHome } from "packages/types";
import { Button, ClientSelector } from "packages/ui/components";
import { PdfModal } from "packages/ui/components/modals";

import DocumentUploadModal from "./DocumentUploadModal";
import SavedHomesContent from "./SavedHomesContent";
import SavedPageModals from "./SavedPageModals";
import SavedPageTabsAndSearch from "./SavedPageTabsAndSearch";

type SavedPageViewType = "homes" | "documents";
type EventTypeFilter = "listed" | "price_change" | "sold" | "withdrawn" | "";

export type SavedPageLayoutProps = {
  isMobile: boolean;
  viewType: SavedPageViewType;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedClientId: string | null;
  setSelectedClientId: (v: string | null) => void;
  eventTypeFilter: EventTypeFilter;
  setEventTypeFilter: (v: EventTypeFilter) => void;
  setViewType: (v: SavedPageViewType) => void;
  filteredHomes: SavedHome[];
  filteredDocuments: DocumentData[];
  loading: boolean;
  documentsLoadingState: boolean;
  agreements: Agreement[];
  agreementsLoading: boolean;
  selectedHomesForComparison: Set<string>;
  selectedHomesData: SavedHome[];
  selectedProperty: unknown;
  isLoadingPropertyDetails: boolean;
  isCompareModalOpen: boolean;
  isNegotiationModalOpen: boolean;
  selectedHomeForNegotiation: SavedHome | null;
  isDocumentUploadModalOpen: boolean;
  setIsDocumentUploadModalOpen: (v: boolean) => void;
  isCreateAgreementModalOpen: boolean;
  setIsCreateAgreementModalOpen: (v: boolean) => void;
  selectedAgreementId: string | null;
  setSelectedAgreementId: (v: string | null) => void;
  isAgent: boolean;
  homes: SavedHome[];
  currentPdf: string | null;
  currentDocumentId: string | null;
  currentDocumentName: string | null;
  closePdfModal: () => void;
  // Document actions (optional on web layout, required for native layout)
  onViewDocument?: (documentId: string, documentName: string) => void;
  onDownloadDocument?: (documentId: string, documentName: string) => Promise<void>;
  onShareDocument?: (
    documentId: string,
    documentName: string
  ) => Promise<{ success: boolean; message: string }>;
  onToggleHomeSelection: (homeId: string) => void;
  onUnlockHome: (home: SavedHome) => Promise<void>;
  onOpenNegotiation: (home: SavedHome) => void;
  onDocumentDelete: (docId: string) => void;
  onAgreementClick: (agreementId: string) => void;
  onAgreementSend: (agreementId: string) => void;
  onAgreementVoid: (agreementId: string) => void;
  onRemoveFromComparison: (homeId: string) => void;
  onCloseNegotiation: () => void;
  onCompare: () => void;
  onClearComparison: () => void;
  clearSelectedProperty: () => void;
  refetchDocuments: () => Promise<unknown>;
  onCreateAgreementSuccess: () => void;
  // Optional refresh controls (used by native layout)
  refresh?: () => Promise<void> | void;
  refreshing?: boolean;
};

export function SavedPageLayout({
  isMobile,
  viewType,
  searchTerm,
  setSearchTerm,
  selectedClientId,
  setSelectedClientId,
  eventTypeFilter,
  setEventTypeFilter,
  setViewType,
  filteredHomes,
  filteredDocuments,
  loading,
  documentsLoadingState,
  agreements,
  agreementsLoading,
  selectedHomesForComparison,
  selectedHomesData,
  selectedProperty,
  isLoadingPropertyDetails,
  isCompareModalOpen,
  setIsCompareModalOpen,
  isNegotiationModalOpen,
  selectedHomeForNegotiation,
  isDocumentUploadModalOpen,
  setIsDocumentUploadModalOpen,
  isCreateAgreementModalOpen,
  setIsCreateAgreementModalOpen,
  selectedAgreementId,
  setSelectedAgreementId,
  isAgent,
  homes,
  currentPdf,
  currentDocumentId,
  currentDocumentName,
  closePdfModal,
  // Currently unused in the web layout but passed through for native layout parity
  // onViewDocument,
  // onDownloadDocument,
  // onShareDocument,
  onToggleHomeSelection,
  onUnlockHome,
  onOpenNegotiation,
  onDocumentDelete,
  onAgreementClick,
  onAgreementSend,
  onAgreementVoid,
  onRemoveFromComparison,
  onCloseNegotiation,
  onCompare,
  onClearComparison,
  clearSelectedProperty,
  refetchDocuments,
  onCreateAgreementSuccess,
  // refresh,
  // refreshing,
}: SavedPageLayoutProps) {
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
        <div className="px-responsive-lg w-full">
          {!isMobile && (
            <>
              <div className="mb-4 w-full">
                <ClientSelector
                  selectedClientId={selectedClientId}
                  onClientChange={setSelectedClientId}
                />
              </div>
              <div className="w-full">
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
            </>
          )}
          {viewType === "documents" && isAgent && (
            <div className="mb-4 w-full">
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsCreateAgreementModalOpen(true)}
              >
                Create Agreement
              </Button>
            </div>
          )}
          <SavedHomesContent
            viewType={viewType}
            filteredHomes={filteredHomes}
            homesLoading={loading}
            documents={filteredDocuments}
            documentsLoading={documentsLoadingState}
            agreements={agreements}
            agreementsLoading={agreementsLoading}
            selectedHomesForComparison={selectedHomesForComparison}
            onToggleHomeSelection={onToggleHomeSelection}
            onUnlockHome={onUnlockHome}
            onOpenNegotiation={onOpenNegotiation}
            onDocumentDelete={onDocumentDelete}
            onAgreementClick={onAgreementClick}
            onAgreementSend={onAgreementSend}
            onAgreementVoid={onAgreementVoid}
            selectedHomesDataLength={selectedHomesData.length}
            noPadding
          />
        </div>
        <SavedPageModals
          viewType={viewType}
          selectedProperty={selectedProperty}
          clearSelectedProperty={clearSelectedProperty}
          isLoadingPropertyDetails={isLoadingPropertyDetails}
          isCompareModalOpen={isCompareModalOpen}
          setIsCompareModalOpen={setIsCompareModalOpen}
          selectedHomesData={selectedHomesData}
          handleRemoveFromComparison={onRemoveFromComparison}
          handleToggleHomeSelection={onToggleHomeSelection}
          homes={homes}
          isNegotiationModalOpen={isNegotiationModalOpen}
          selectedHomeForNegotiation={selectedHomeForNegotiation}
          handleCloseNegotiation={onCloseNegotiation}
          handleCompare={onCompare}
          handleClearComparison={onClearComparison}
        />
        <DocumentUploadModal
          isOpen={isDocumentUploadModalOpen}
          onClose={() => setIsDocumentUploadModalOpen(false)}
          onUploadSuccess={refetchDocuments}
        />
        {isAgent && (
          <CreateAgreementModal
            isOpen={isCreateAgreementModalOpen}
            onClose={() => setIsCreateAgreementModalOpen(false)}
            preselectedBuyerId={selectedClientId ?? undefined}
            onSuccess={onCreateAgreementSuccess}
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
