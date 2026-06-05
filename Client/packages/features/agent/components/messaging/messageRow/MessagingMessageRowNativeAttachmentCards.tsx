import React from "react";

import { Linking } from "react-native";

import { useLocalization } from "packages/contexts";
import type { DocumentData } from "packages/features/documents";
import {
  isChecklistFormMessagingAttachmentUnavailable,
  mergeSharedDocumentForDisplay,
  parseSharedAttachmentSnapshot,
  type SharedChecklistFormSnapshot,
} from "packages/features/messaging";
import { Box, Pressable, Text } from "packages/ui/components/structure/primitives";

export type ChecklistFormAvailabilityOptions = {
  formsLibraryLoading: boolean;
  formsLibraryError: Error | null;
  checklistFormIdsInLibrary: Set<string> | null;
};

export function MessagingChecklistFormCardNative({
  form,
  checklistFormAvailability,
}: {
  form: SharedChecklistFormSnapshot;
  checklistFormAvailability: ChecklistFormAvailabilityOptions;
}) {
  const { t } = useLocalization();
  const formUnavailable = isChecklistFormMessagingAttachmentUnavailable(
    form,
    checklistFormAvailability
  );
  const formTitle = form.title?.trim() || form.form_key;
  if (formUnavailable) {
    return (
      <Box className="border-border bg-background-base mb-2 w-full max-w-full rounded-lg border border-dashed p-3">
        <Text className="text-text-secondary text-xs font-medium">
          {t("agent.shared_checklist_form_label")}
        </Text>
        <Text className="text-text-primary mt-1 text-sm font-medium" numberOfLines={3}>
          {formTitle}
        </Text>
        <Text className="text-text-secondary mt-2 text-sm font-semibold">
          {t("agent.messaging_form_deleted_title")}
        </Text>
        <Text className="text-text-secondary mt-1 text-xs">
          {t("agent.messaging_form_deleted_body")}
        </Text>
      </Box>
    );
  }
  return (
    <Box className="border-border bg-background-base mb-2 w-full max-w-full rounded-lg border p-3">
      <Text className="text-text-secondary text-xs font-medium">
        {t("agent.shared_checklist_form_label")}
      </Text>
      <Text className="text-text-primary mt-1 text-sm font-medium" numberOfLines={3}>
        {formTitle}
      </Text>
      <Pressable
        className="border-border mt-3 self-start rounded-lg border px-3 py-2"
        onPress={() => {
          const url = form.download_url;
          if (url) void Linking.openURL(url);
        }}
      >
        <Text className="text-text-primary text-sm font-medium">
          {t("agent.open_checklist_form_pdf")}
        </Text>
      </Pressable>
    </Box>
  );
}

export function MessagingBundleDocumentCardNative({ document }: { document: DocumentData }) {
  return (
    <Box className="border-border bg-background-base mb-2 rounded-lg border p-3">
      <Text className="text-text-secondary text-xs font-medium">Shared document</Text>
      <Text className="text-text-primary mt-1 text-sm" numberOfLines={2}>
        {document.address || document.filename || "Document"}
      </Text>
      {document.document_type ? (
        <Text className="text-text-secondary mt-1 text-xs" numberOfLines={1}>
          {document.document_type}
        </Text>
      ) : null}
    </Box>
  );
}

export function MessagingMergedSharedDocumentNative({
  content,
  sharedDocumentId,
  documents,
}: {
  content: string;
  sharedDocumentId: string;
  documents: DocumentData[];
}) {
  const document = mergeSharedDocumentForDisplay(content, sharedDocumentId, documents);
  const snap = parseSharedAttachmentSnapshot(content);
  const previewLabel = document
    ? document.filename || document.address || "Document"
    : snap?.kind === "document"
      ? snap.displayLine
      : content?.trim();
  if (!document) {
    if (previewLabel) {
      return (
        <Box className="border-border bg-background-base mb-2 rounded-lg border p-3">
          <Text className="text-text-secondary text-xs font-medium">Shared document</Text>
          <Text className="text-text-primary mt-1 text-sm" numberOfLines={2}>
            {previewLabel}
          </Text>
        </Box>
      );
    }
    return (
      <Box className="border-border bg-background-base mb-2 rounded-lg border p-3">
        <Text className="text-text-secondary text-xs font-medium">Shared document</Text>
        <Text className="text-text-secondary mt-1 text-sm" numberOfLines={1}>
          Document not found or has been deleted.
        </Text>
      </Box>
    );
  }
  return (
    <Box className="border-border bg-background-base mb-2 rounded-lg border p-3">
      <Text className="text-text-secondary text-xs font-medium">Shared document</Text>
      <Text className="text-text-primary mt-1 text-sm" numberOfLines={2}>
        {document.address || document.filename || "Document"}
      </Text>
      {document.document_type ? (
        <Text className="text-text-secondary mt-1 text-xs" numberOfLines={1}>
          {document.document_type}
        </Text>
      ) : null}
    </Box>
  );
}
