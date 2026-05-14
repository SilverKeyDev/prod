import { useMemo } from "react";

import { useLocalization } from "packages/contexts";
import {
  useDocumentActions,
  useDocumentsDataIntegration,
  useSavedPageDocumentHandlers,
} from "packages/features/documents";
import { PdfModal } from "packages/features/documents/components/pdf/PdfModalBridge";
import type { AgreementData } from "packages/ui/components/cards/agreement";
import { AgreementCard } from "packages/ui/components/cards/agreement";
import { Box } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import { BodyText, KeyTurnLoader } from "@/components/ui";
import { ClientHubDocumentSigningModals } from "@/features/dashboard/components/ClientHub/ClientHubDocumentSigningModals";

type ClientHubAgreementsProps = {
  clientId: string;
};

export function ClientHubAgreements({ clientId }: ClientHubAgreementsProps) {
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

  const agreementDocs = sortedDocuments.filter((d) => d.library_kind === "agreement");

  const externalActionHandlers = useMemo(
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
            <KeyTurnLoader message={t("saved.loading_agreements")} />
          </Box>
        ) : agreementDocs.length === 0 ? (
          <Box className="py-responsive-lg w-full text-center">
            <BodyText as="p" size="sm" className="text-responsive-sm text-text-secondary">
              {t("saved.no_agreements_yet")}
            </BodyText>
          </Box>
        ) : (
          <Box className="gap-responsive-md grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {agreementDocs.map((doc) => (
              <Box key={`agreement-${doc.id}`} className="group relative w-full">
                <AgreementCard
                  doc={doc as AgreementData}
                  onDelete={(d) => {
                    void handleDocumentDelete(d);
                  }}
                  isAgent
                  externalActionHandlers={externalActionHandlers}
                />
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
