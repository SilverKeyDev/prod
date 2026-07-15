import { useLocalization } from "packages/contexts";
import type { DocumentData, SavedPageViewType } from "packages/features/documents";
import { PdfModal } from "packages/features/documents/components/pdf/PdfModalBridge";
import SavedPageTabsAndSearch from "packages/features/saved/components/header/SavedPageTabsAndSearch";
import SavedHomesContent from "packages/features/saved/components/SavedHomesContent";
import SavedPageModals from "packages/features/saved/components/SavedPageModals";
import DocumentUploadModal from "packages/features/saved/components/upload/DocumentUploadModal";
import type { LibraryViewMode } from "packages/features/saved/hooks/ui/useLibraryViewMode";
import type { Property } from "packages/features/search";
import type { SavedHome, SearchResult } from "packages/types";
import { Input } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import { BaseModal } from "packages/ui/components/surfaces/modals";

import { ClientSelector } from "@/components/ui";
import { BodyText, Button, Label } from "@/components/ui";

type EventTypeFilter = "listed" | "price_change" | "sold" | "withdrawn" | "";

type SendForSignatureModalState = {
  isOpen: boolean;
  title: string;
  recipientClientId: string | null;
  isSubmitting: boolean;
  disabledReason: string | null;
  onTitleChange: (value: string) => void;
  onRecipientClientChange: (value: string | null) => void;
  onClose: () => void;
  onConfirm: () => void;
};

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
  libraryViewMode: LibraryViewMode;
  onLibraryViewModeChange: (mode: LibraryViewMode) => void;
  showLibraryViewToggle: boolean;
  librarySortKey: string;
  onLibrarySortChange: (value: string) => void;
  filteredHomes: SavedHome[];
  filteredDocuments: DocumentData[];
  loading: boolean;
  documentsLoadingState: boolean;
  selectedHomesForComparison: Set<string>;
  selectedHomesData: SavedHome[];
  selectedProperty: Property | SearchResult | null;
  isLoadingPropertyDetails: boolean;
  isCompareModalOpen: boolean;
  setIsCompareModalOpen: (v: boolean) => void;
  isNegotiationModalOpen: boolean;
  selectedHomeForNegotiation: SavedHome | null;
  isDocumentUploadModalOpen: boolean;
  setIsDocumentUploadModalOpen: (v: boolean) => void;
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
  onSendForSignature?: (document: DocumentData) => void;
  onSignNow?: (document: DocumentData) => void;
  onViewSignedAgreement?: (document: DocumentData) => void;
  onFormSendForSignature?: (form: import("packages/features/documents").ChecklistForm) => void;
  /** Total checklist forms in library (for toolbar count on Forms tab). */
  formsLibraryTotalCount: number;
  sendForSignatureModal?: SendForSignatureModalState;
  onToggleHomeSelection: (homeId: string) => void;
  onUnlockHome: (home: SavedHome) => Promise<void>;
  onDocumentDelete: (doc: DocumentData) => void;
  onRemoveFromComparison: (homeId: string) => void;
  onCloseNegotiation: () => void;
  onCompare: () => void;
  onClearComparison: () => void;
  clearSelectedProperty: () => void;
  refetchDocuments: () => Promise<unknown>;
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
  libraryViewMode,
  onLibraryViewModeChange,
  showLibraryViewToggle,
  librarySortKey,
  onLibrarySortChange,
  filteredHomes,
  filteredDocuments,
  loading,
  documentsLoadingState,
  selectedHomesForComparison,
  selectedHomesData,
  selectedProperty,
  onFormSendForSignature,
  formsLibraryTotalCount: _formsLibraryTotalCount,
  isLoadingPropertyDetails,
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
  onToggleHomeSelection,
  onUnlockHome,
  onDocumentDelete,
  onRemoveFromComparison,
  onCloseNegotiation,
  onCompare,
  onClearComparison,
  clearSelectedProperty,
  refetchDocuments,
  onViewDocument,
  onDownloadDocument,
  onShareDocument,
  onSendForSignature,
  onSignNow,
  onViewSignedAgreement,
  sendForSignatureModal,
}: SavedPageLayoutProps) {
  const { t } = useLocalization();
  return (
    <Box>
      <PdfModal
        currentPdf={currentPdf}
        currentReportAddress={currentDocumentName}
        reportId={currentDocumentId}
        onClose={closePdfModal}
      />
      <Box className="mb-responsive-lg mt-4 flex flex-col gap-4 sm:mt-6">
        {/* Mirror DashboardScreen: horizontal inset inside dashboard-content (outer shell uses md:px-0). */}
        <Box className="w-full px-4">
          {!isMobile && (
            <Box className="w-full">
              <SavedPageTabsAndSearch
                isAgent={isAgent}
                toolbarLeading={
                  isAgent ? (
                    <ClientSelector
                      selectedClientId={selectedClientId}
                      onClientChange={setSelectedClientId}
                    />
                  ) : undefined
                }
                toolbarShowSearch
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchPlaceholder={
                  viewType === "documents"
                    ? t("saved.search_documents_placeholder")
                    : viewType === "agreements"
                      ? "Search agreements..."
                      : viewType === "forms-library"
                        ? t("saved.search_forms_placeholder")
                        : "Search"
                }
                viewType={viewType}
                onViewTypeChange={setViewType}
                eventTypeFilter={eventTypeFilter}
                onEventTypeFilterChange={setEventTypeFilter}
                onUploadClick={() => setIsDocumentUploadModalOpen(true)}
                libraryViewMode={libraryViewMode}
                onLibraryViewModeChange={onLibraryViewModeChange}
                showLibraryViewToggle={showLibraryViewToggle}
                librarySortKey={librarySortKey}
                onLibrarySortChange={onLibrarySortChange}
              />
            </Box>
          )}
          <SavedHomesContent
            viewType={viewType}
            libraryViewMode={libraryViewMode}
            librarySortKey={librarySortKey}
            searchTerm={searchTerm}
            filteredHomes={filteredHomes}
            homesLoading={loading}
            documents={filteredDocuments}
            documentsLoading={documentsLoadingState}
            selectedHomesForComparison={selectedHomesForComparison}
            onToggleHomeSelection={onToggleHomeSelection}
            onUnlockHome={onUnlockHome}
            onDocumentDelete={onDocumentDelete}
            documentActionHandlers={
              onViewDocument && onDownloadDocument && onShareDocument
                ? {
                    handleViewDocument: onViewDocument,
                    handleDownloadDocument: onDownloadDocument,
                    handleShareDocument: onShareDocument,
                    handleSendForSignature: onSendForSignature,
                    handleSignNow: onSignNow,
                    handleViewSignedAgreement: onViewSignedAgreement,
                    isAgent,
                  }
                : undefined
            }
            onFormSendForSignature={onFormSendForSignature}
            selectedHomesDataLength={selectedHomesData.length}
            noPadding
            isAgent={isAgent}
          />
        </Box>
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
        {sendForSignatureModal ? (
          <BaseModal
            isOpen={sendForSignatureModal.isOpen}
            onClose={sendForSignatureModal.onClose}
            title={t("forms.send_for_signature")}
            size="md"
            showCloseButton
            closeOnBackdropClick={!sendForSignatureModal.isSubmitting}
          >
            <Box className="flex flex-col gap-4">
              <Box className="flex flex-col gap-2">
                <Label size="sm">Agreement title</Label>
                <Input
                  value={sendForSignatureModal.title}
                  onChange={(event) => sendForSignatureModal.onTitleChange(event.target.value)}
                  placeholder="Agreement title"
                  disabled={sendForSignatureModal.isSubmitting}
                />
              </Box>
              <Box className="flex flex-col gap-2">
                <Label size="sm">Recipient</Label>
                <ClientSelector
                  selectedClientId={sendForSignatureModal.recipientClientId}
                  onClientChange={sendForSignatureModal.onRecipientClientChange}
                  hideMeOption
                />
              </Box>
              {sendForSignatureModal.disabledReason ? (
                <BodyText size="xs" className="text-amber-700">
                  {sendForSignatureModal.disabledReason}
                </BodyText>
              ) : null}
              <Box className="mt-2 flex justify-end gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={sendForSignatureModal.onClose}
                  disabled={sendForSignatureModal.isSubmitting}
                  iconName="arrow-left"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={sendForSignatureModal.onConfirm}
                  disabled={
                    sendForSignatureModal.isSubmitting ||
                    sendForSignatureModal.title.trim().length === 0 ||
                    !sendForSignatureModal.recipientClientId ||
                    sendForSignatureModal.disabledReason != null
                  }
                  iconName="send"
                >
                  {sendForSignatureModal.isSubmitting ? t("agent.sending") : t("agent.send")}
                </Button>
              </Box>
            </Box>
          </BaseModal>
        ) : null}
      </Box>
    </Box>
  );
}
