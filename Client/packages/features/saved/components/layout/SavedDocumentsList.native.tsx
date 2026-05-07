import React, { useCallback } from "react";

import Button from "@ui/button/Button";

import { useLocalization } from "packages/contexts";
import type { DocumentData } from "packages/features/documents";
import { useAuthStore } from "packages/store";
import { Box, Text } from "packages/ui/components/primitives";
import { getContextualAgreementStatus } from "packages/utils/agreement/contextualAgreementStatus";
import { dateParseISO } from "packages/utils/date";

interface SavedDocumentsListProps {
  sortedDocuments: DocumentData[];
  loading: boolean;
  showEmpty: boolean;
  isAgent: boolean;
  onViewDocument?: (docId: string, filename: string) => void;
  onDownloadDocument?: (docId: string, filename: string) => void;
  onShareDocument?: (docId: string, filename: string) => void;
  onSendForSignature?: (doc: DocumentData) => void;
  onSignNow?: (doc: DocumentData) => void;
  onDocumentDelete: (doc: DocumentData) => void;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  try {
    const parsed = dateParseISO(value);
    if (!parsed.isValid()) return "";
    return parsed.toDate().toLocaleDateString();
  } catch {
    return "";
  }
}

export function SavedDocumentsList({
  sortedDocuments,
  loading,
  showEmpty,
  isAgent,
  onViewDocument,
  onDownloadDocument,
  onShareDocument,
  onSendForSignature,
  onSignNow,
  onDocumentDelete,
}: SavedDocumentsListProps) {
  const { t } = useLocalization();
  const viewerUserId = useAuthStore((s) => s.user?.id);
  const viewerEmail = useAuthStore((s) => s.user?.email);

  const renderDocument = useCallback(
    (doc: DocumentData) => (
      <Box
        key={`doc-${doc.id}`}
        className="border-border bg-background-surface mb-3 rounded-lg border p-3 shadow-sm"
      >
        <Text className="text-text-primary text-sm font-semibold" numberOfLines={2}>
          {doc.address || doc.filename}
        </Text>
        <Text className="text-text-secondary mt-1 text-xs">
          {formatDate(doc.created_at)} · {doc.document_type ?? "Document"}
        </Text>
        {doc.library_kind === "agreement" ? (
          <Text className="mt-1 text-xs font-semibold text-blue-700">Status: {doc.status}</Text>
        ) : null}
        <Box className="mt-3 flex flex-row flex-wrap gap-2">
          {onViewDocument && (
            <Button
              variant="primary"
              size="sm"
              onPress={() => onViewDocument(doc.id, doc.filename)}
              className="min-w-[30%] flex-1"
              iconName="save"
            >
              <Text className="text-sm font-medium">
                {t("saved.view_document")}
              </Text>
            </Button>
          )}
          {onDownloadDocument && (
            <Button
              variant="secondary"
              size="sm"
              onPress={() => onDownloadDocument(doc.id, doc.filename)}
              className="min-w-[30%] flex-1"
              iconName="download"
            >
              <Text className="text-sm font-medium">
                {t("saved.download_document")}
              </Text>
            </Button>
          )}
          {onShareDocument && (
            <Button
              variant="secondary"
              size="sm"
              onPress={() => onShareDocument(doc.id, doc.filename)}
              className="min-w-[30%] flex-1"
              iconName="share"
            >
              <Text className="text-sm font-medium">
                {t("saved.share_document")}
              </Text>
            </Button>
          )}
          {onSendForSignature && isAgent && doc.library_kind !== "agreement" && (
            <Button
              variant="secondary"
              size="sm"
              onPress={() => onSendForSignature(doc)}
              className="min-w-[30%] flex-1"
              iconName="send"
            >
              <Text className="text-sm font-medium">{t("forms.send_for_signature")}</Text>
            </Button>
          )}
          {onSignNow &&
            doc.library_kind === "agreement" &&
            viewerUserId &&
            doc.participants?.length &&
            getContextualAgreementStatus(doc, viewerUserId, isAgent, viewerEmail) ===
              "sign_now" && (
              <Button
                variant="secondary"
                size="sm"
                onPress={() => onSignNow(doc)}
                className="min-w-[30%] flex-1"
                iconName="file-signature"
              >
                <Text className="text-sm font-medium">Sign now</Text>
              </Button>
            )}
          <Button
            variant="secondary"
            size="sm"
            onPress={() => onDocumentDelete(doc)}
            className="min-w-[30%] flex-1"
            iconName="trash-2"
          >
            <Text className="text-sm font-medium text-red-700">
              {t("saved.delete_document")}
            </Text>
          </Button>
        </Box>
      </Box>
    ),
    [
      isAgent,
      onDocumentDelete,
      onDownloadDocument,
      onSendForSignature,
      onShareDocument,
      onSignNow,
      onViewDocument,
      t,
      viewerEmail,
      viewerUserId,
    ]
  );

  if (loading) {
    return (
      <Box className="py-8">
        <Text className="text-text-secondary text-center text-sm">
          {t("saved.loading_documents", {
            defaultValue: "Loading documents…",
          })}
        </Text>
      </Box>
    );
  }

  if (showEmpty) {
    return (
      <Box className="py-8">
        <Text className="text-text-secondary text-center text-sm">
          {t("saved.no_documents_yet", {
            defaultValue: "No documents yet. Upload documents to see them here.",
          })}
        </Text>
      </Box>
    );
  }

  return <>{sortedDocuments.map((doc) => renderDocument(doc))}</>;
}
