import React, { useCallback, useEffect, useState } from "react";

import Button from "@ui/button/Button";

import { useLocalization } from "packages/contexts";
import { useDocuments } from "packages/features/documents";
import { useUIStore } from "packages/store";
import { BaseModal } from "packages/ui/components/modals";
import { Box, Text } from "packages/ui/components/primitives";
import { Platform } from "packages/utils/platform";

type DocumentUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void | Promise<unknown>;
};

type PickerAsset = { uri: string; name?: string; mimeType?: string; size?: number };

type UploadableFile = File & { uri?: string };

function DocumentUploadModalNativeBody({
  onClose,
  onUploadSuccess,
}: {
  onClose: () => void;
  onUploadSuccess?: () => void | Promise<unknown>;
}) {
  const { t } = useLocalization();
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const { uploadDocument } = useDocuments();

  const [selectedFile, setSelectedFile] = useState<PickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePickFile = useCallback(async () => {
    try {
      const DocumentPicker = await import("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: ["application/pdf", "image/*"],
      });

      if (result.canceled) return;

      setSelectedFile(result.assets[0] ?? null);
    } catch (error) {
      enqueueToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : t("documents_upload.error_selecting_file", {
                defaultValue: "Unable to select file. Please try again.",
              }),
      });
    }
  }, [enqueueToast, t]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !selectedFile.uri) {
      enqueueToast({
        type: "error",
        message: t("documents_upload.missing_file"),
      });
      return;
    }

    setIsUploading(true);

    try {
      const pseudoFile: UploadableFile = {
        uri: selectedFile.uri,
        name: selectedFile.name ?? "document",
        type: selectedFile.mimeType ?? "application/octet-stream",
        size: selectedFile.size ?? 0,
      } as UploadableFile;

      await uploadDocument(pseudoFile);

      enqueueToast({
        type: "success",
        message: t("documents_upload.upload_success", {
          defaultValue: "Document uploaded successfully",
        }),
      });

      setSelectedFile(null);

      if (onUploadSuccess) {
        await onUploadSuccess();
      }

      onClose();
    } catch (error) {
      enqueueToast({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : t("documents_upload.upload_failed", {
                defaultValue: "Failed to upload document",
              }),
      });
    } finally {
      setIsUploading(false);
    }
  }, [enqueueToast, onClose, onUploadSuccess, selectedFile, t, uploadDocument]);

  return (
    <Box className="gap-4">
      <Box className="gap-3">
        <Text className="text-text-primary text-sm font-medium">
          {t("documents_upload.document_file", {
            defaultValue: "Document file",
          })}
        </Text>
        <Button variant="secondary" size="md" onPress={handlePickFile} disabled={isUploading}>
          <Text className="text-text-primary text-sm font-medium">
            {selectedFile
              ? (selectedFile.name ??
                t("documents_upload.change_file", { defaultValue: "Change file" }))
              : t("documents_upload.click_to_select", { defaultValue: "Select file" })}
          </Text>
        </Button>
        {selectedFile && (
          <Text className="text-text-secondary text-xs">
            {selectedFile.name}{" "}
            {selectedFile.size != null
              ? `(${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`
              : ""}
          </Text>
        )}
      </Box>

      <Box className="mt-2 flex flex-row justify-end gap-3">
        <Button variant="secondary" size="md" onPress={onClose} disabled={isUploading}>
          <Text className="text-text-primary text-sm font-medium">
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Text>
        </Button>
        <Button
          variant="primary"
          size="md"
          onPress={handleUpload}
          disabled={!selectedFile || isUploading}
        >
          <Text className="text-sm font-medium text-white">
            {isUploading
              ? t("documents_upload.uploading", { defaultValue: "Uploading…" })
              : t("documents_upload.upload_document", { defaultValue: "Upload document" })}
          </Text>
        </Button>
      </Box>
    </Box>
  );
}

export default function DocumentUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: DocumentUploadModalProps) {
  const { t } = useLocalization();
  const [WebUpload, setWebUpload] = useState<React.ComponentType<{
    onUploadSuccess?: () => void | Promise<unknown>;
    useCard?: boolean;
  }> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line silverkey/no-platform-feature-check -- Platform.OS selects UI implementation (web DOM vs native picker), not a feature flag
    if (Platform.OS === "web") {
      void import("./DocumentUpload").then((m) => setWebUpload(() => m.default));
    }
  }, []);

  const handleUploadSuccess = useCallback(async () => {
    if (onUploadSuccess) {
      await onUploadSuccess();
    }
    setTimeout(() => onClose(), 500);
  }, [onClose, onUploadSuccess]);

  if (!isOpen) return null;

  // eslint-disable-next-line silverkey/no-platform-feature-check -- Select modal body by platform (web DOM form vs native picker form)
  const isWeb = Platform.OS === "web";

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("documents_upload.modal_title", { defaultValue: "Upload Document" })}
      size="lg"
      showCloseButton
      closeOnBackdropClick
      closeOnEscape={isWeb}
    >
      {isWeb ? (
        WebUpload ? (
          <WebUpload onUploadSuccess={handleUploadSuccess} useCard={false} />
        ) : null
      ) : (
        <DocumentUploadModalNativeBody onClose={onClose} onUploadSuccess={onUploadSuccess} />
      )}
    </BaseModal>
  );
}
