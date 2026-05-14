import { useEffect } from "react";

import { useDocumentActions, useDocumentsStoreIntegration } from "packages/features/documents";
import { PdfModal } from "packages/features/documents/components/pdf/PdfModalBridge";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useUIStore } from "packages/store";
import Loading from "packages/ui/components/asset/loading/Loading";
import { Box, Pressable, ScrollView, Text } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import { BodyText, Title } from "@/components/ui";

type ClientDocumentsProps = {
  userId: string;
};

export default function ClientDocuments({ userId: _userId }: ClientDocumentsProps) {
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const {
    documents,
    documentsLoading: loading,
    documentsError: error,
  } = useDocumentsStoreIntegration();
  const { currentPdf, currentDocumentId, currentDocumentName, closePdfModal, handleViewDocument } =
    useDocumentActions();

  useEffect(() => {
    if (error) {
      enqueueToast({ type: "error", message: error });
    }
  }, [error, enqueueToast]);

  const onDocumentPress = (doc: { id: string; name: string }) => {
    log.debug(LOG_CATEGORIES.DASHBOARD, "Open document from client hub", {
      documentId: doc.id,
    });
    handleViewDocument(doc.id, doc.name);
  };

  if (loading) {
    return (
      <Box className="items-center justify-center py-8">
        <Loading message="Loading documents..." />
      </Box>
    );
  }

  if (documents.length === 0) {
    return (
      <Box className="items-center justify-center py-8">
        <BodyText size="sm" className="text-text-tertiary">
          No documents found for this client.
        </BodyText>
      </Box>
    );
  }

  return (
    <>
      <PdfModal
        currentPdf={currentPdf}
        currentReportAddress={currentDocumentName}
        reportId={currentDocumentId}
        onClose={closePdfModal}
      />
      <ScrollView className="flex-1">
        <Box className="gap-3 py-1">
          {documents.map((doc) => (
            <Pressable
              key={doc.id}
              className="border-border bg-background-surface rounded-lg border px-4 py-3"
              onPress={() => onDocumentPress(doc)}
            >
              <Title as="h3" size="sm" className="text-text-primary font-medium">
                {doc.name}
              </Title>
              <BodyText size="sm" className="text-text-tertiary mt-1">
                {doc.category}
                {doc.uploaded_at
                  ? ` • ${dateParseISO(doc.uploaded_at).toDate().toLocaleDateString()}`
                  : ""}
              </BodyText>
              <Text className="text-text-tertiary mt-1 text-xs">
                {doc.status === "approved" ? "Approved" : "Pending"}
              </Text>
            </Pressable>
          ))}
        </Box>
      </ScrollView>
    </>
  );
}
