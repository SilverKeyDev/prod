import { useCallback, useMemo } from "react";

import { UpcomingEvents } from "packages/features/calendar";
import { useDocumentActions, useDocumentsDataIntegration } from "packages/features/documents";
import { log } from "packages/logger";
import type { UIState } from "packages/store";
import { useUIStore } from "packages/store";
import { Box } from "packages/ui/components/structure/primitives";

import { ClientHubDocumentSigningModals } from "@/features/agent/components/clientHub/ClientHubDocumentSigningModals";
import { useClientHubAgendaTodos } from "@/features/agent/hooks/data/clientHub/useClientHubAgendaTodos";

type ClientHubAgendaProps = {
  clientId: string;
};

export function ClientHubAgenda({ clientId }: ClientHubAgendaProps) {
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  const { handleViewDocument, handleDownloadDocument, handleShareDocument } = useDocumentActions();

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
    signAgreementNow,
    agreementSigningSession,
    dismissAgreementSigning,
    onAgreementSigningComplete,
    viewSignedAgreement,
    dismissViewSignedAgreement,
  } = useDocumentsDataIntegration(clientId, documentHandlers);

  const { agendaTodos, onToggleAgendaTodo, updateAgendaTodo, deleteAgendaTodo } =
    useClientHubAgendaTodos(clientId);

  const onSigningAgendaPress = useCallback(
    async (agreementId: string) => {
      const doc = documents.find((d) => d.id === agreementId && d.library_kind === "agreement");
      if (!doc) {
        enqueueToast({
          type: "error",
          message: "Could not open that document. Try refreshing the page.",
        });
        return;
      }
      try {
        await signAgreementNow(doc);
      } catch (error) {
        log.error("ERRORS", "Agenda DocuSign signing failed", error);
        enqueueToast({
          type: "error",
          message: error instanceof Error ? error.message : "Signing could not start.",
        });
      }
    },
    [documents, enqueueToast, signAgreementNow]
  );

  return (
    <Box className="mt-1 w-full">
      <UpcomingEvents
        suppressConnectionPrompt
        agendaTodos={agendaTodos}
        onToggleAgendaTodo={onToggleAgendaTodo}
        canEditAgendaTodos={true}
        updateAgendaTodo={updateAgendaTodo}
        deleteAgendaTodo={deleteAgendaTodo}
        onSigningAgendaPress={onSigningAgendaPress}
        clientUserId={clientId}
      />
      <ClientHubDocumentSigningModals
        agreementSigningSession={agreementSigningSession}
        dismissAgreementSigning={dismissAgreementSigning}
        onAgreementSigningComplete={onAgreementSigningComplete}
        viewSignedAgreement={viewSignedAgreement}
        dismissViewSignedAgreement={dismissViewSignedAgreement}
      />
    </Box>
  );
}
