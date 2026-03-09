import React, { useEffect } from "react";

import { StyleSheet, View } from "react-native";

import { useDocumentActions, useDocumentsStoreIntegration } from "packages/features/documents";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useUIStore } from "packages/store";
import { PdfModal } from "packages/ui/components/modals";
import { ScrollView } from "packages/ui/components/primitives";
import { Box, Loading, Pressable, Text } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

type ClientDocumentsProps = {
  userId: string;
};

export default function ClientDocumentsNative({ userId: _userId }: ClientDocumentsProps) {
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
      <View style={styles.centered}>
        <Loading />
      </View>
    );
  }

  if (documents.length === 0) {
    return (
      <View style={styles.centered}>
        <Text className="text-xs text-gray-600">No documents found for this client.</Text>
      </View>
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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Box className="gap-3">
          {documents.map((doc) => (
            <Pressable
              key={doc.id}
              className="rounded-lg border border-gray-200 bg-white px-4 py-3"
              onPress={() => onDocumentPress(doc)}
            >
              <Text className="text-sm font-semibold text-gray-900">{doc.name}</Text>
              <Text className="mt-1 text-xs text-gray-600">
                {doc.category}
                {doc.uploaded_at
                  ? ` • ${dateParseISO(doc.uploaded_at).toDate().toLocaleDateString()}`
                  : ""}
              </Text>
              <Text className="mt-1 text-xs text-gray-500">
                {doc.status === "approved" ? "Approved" : "Pending"}
              </Text>
            </Pressable>
          ))}
        </Box>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 4,
  },
  centered: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
