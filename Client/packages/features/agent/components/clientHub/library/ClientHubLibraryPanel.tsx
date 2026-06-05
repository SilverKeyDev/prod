import { useMemo } from "react";

import { useLocalization } from "packages/contexts";
import {
  useDocumentActions,
  useDocumentsDataIntegration,
  useSavedPageDocumentHandlers,
} from "packages/features/documents";
import { PdfModal } from "packages/features/documents/components/pdf/PdfModalBridge";
import { Box } from "packages/ui/components/structure/primitives";
import type { AgreementData } from "packages/ui/components/surfaces/cards/agreement";
import { AgreementCard } from "packages/ui/components/surfaces/cards/agreement";
import DocumentCard from "packages/ui/components/surfaces/cards/document/DocumentCard";
import { dateParseISO } from "packages/utils/core/date";

import { BodyText, KeyTurnLoader } from "@/components/ui";
import { ClientHubDocumentSigningModals } from "@/features/agent/components/clientHub/ClientHubDocumentSigningModals";

type ClientHubLibraryPanelProps = {
  clientId: string;
};

export function ClientHubLibraryPanel({ clientId }: ClientHubLibraryPanelProps) {
  const { t } = useLocalization();
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
    documentsLoading,
    handleViewDocument: documentListView,
    handleDownloadDocument: documentListDownload,
    handleShareDocument: documentListShare,
    handleDelete,
    signAgreementNow,
    agreementSigningSession,
    dismissAgreementSigning,
    onAgreementSigningComplete,
    viewSignedAgreement,
    dismissViewSignedAgreement,
    openViewSignedAgreement,
  } = useDocumentsDataIntegration(clientId, documentHandlers);

  const { handleDocumentDelete } = useSavedPageDocumentHandlers({
    handleViewDocument: documentListView,
    handleDownloadDocument: documentListDownload,
    handleShareDocument: documentListShare,
    handleDelete,
    documents,
  });

  const sortedDocuments = useMemo(() => {
    const toMs = (v: number | string) => (typeof v === "number" ? v : dateParseISO(v).valueOf());
    return [...documents].sort((a, b) => {
      const dateA = toMs(a.created_at ?? a.updated_at ?? 0);
      const dateB = toMs(b.created_at ?? b.updated_at ?? 0);
      return dateB - dateA;
    });
  }, [documents]);

  const agreementActionHandlers = useMemo(
    () => ({
      handleViewDocument: documentListView,
      handleDownloadDocument: documentListDownload,
      handleShareDocument: documentListShare,
      handleSignNow: (doc: AgreementData) => {
        void signAgreementNow(doc).catch(() => {});
      },
      handleViewSignedAgreement: openViewSignedAgreement,
    }),
    [
      documentListView,
      documentListDownload,
      documentListShare,
      signAgreementNow,
      openViewSignedAgreement,
    ]
  );

  const documentActionHandlers = useMemo(
    () => ({
      handleViewDocument: documentListView,
      handleDownloadDocument: documentListDownload,
      handleShareDocument: documentListShare,
    }),
    [documentListView, documentListDownload, documentListShare]
  );

  return (
    <>
      <PdfModal
        currentPdf={currentPdf}
        currentReportAddress={currentDocumentName}
        reportId={currentDocumentId}
        onClose={closePdfModal}
      />
      <Box className="mt-1 w-full">
        {documentsLoading ? (
          <Box className="py-responsive-lg flex w-full justify-center">
            <KeyTurnLoader message={t("saved.loading_documents")} />
          </Box>
        ) : sortedDocuments.length === 0 ? (
          <Box className="py-responsive-lg w-full text-center">
            <BodyText as="p" size="sm" className="text-responsive-sm text-text-secondary">
              {t("dashboard.library_empty")}
            </BodyText>
          </Box>
        ) : (
          <Box className="gap-responsive-md grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedDocuments.map((doc) => (
              <Box key={doc.id} className="group relative w-full">
                {doc.library_kind === "agreement" ? (
                  <AgreementCard
                    doc={doc as AgreementData}
                    onDelete={(d) => {
                      void handleDocumentDelete(d);
                    }}
                    isAgent
                    externalActionHandlers={agreementActionHandlers}
                  />
                ) : (
                  <DocumentCard
                    doc={doc}
                    onDelete={(d) => {
                      void handleDocumentDelete(d);
                    }}
                    externalActionHandlers={documentActionHandlers}
                  />
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
      <ClientHubDocumentSigningModals
        agreementSigningSession={agreementSigningSession}
        dismissAgreementSigning={dismissAgreementSigning}
        onAgreementSigningComplete={onAgreementSigningComplete}
        viewSignedAgreement={viewSignedAgreement}
        dismissViewSignedAgreement={dismissViewSignedAgreement}
      />
    </>
  );
}
