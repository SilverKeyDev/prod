import React, { useCallback, useEffect, useState } from "react";

import Button from "@ui/button/Button";

import { useLocalization } from "packages/contexts";
import {
  type ChecklistForm,
  FormsBrowser,
  useDocuments,
} from "packages/features/documents";
import { useAuthStore, useUIStore } from "packages/store";
import { BaseModal } from "packages/ui/components/modals";
import { Box, Text } from "packages/ui/components/primitives";
import { Platform } from "packages/utils/platform";

import { UnderlineTabs } from "@/components/ui";

type DocumentUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void | Promise<unknown>;
};

type UploadTab = "upload" | "forms";

type PickerAsset = {
  uri: string;
  name?: string;
  mimeType?: string;
  size?: number;
};

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
        <Button
          variant="secondary"
          size="md"
          onPress={handlePickFile}
          disabled={isUploading}
        >
          <Text className="text-text-primary text-sm font-medium">
            {selectedFile
              ? selectedFile.name ??
                t("documents_upload.change_file", {
                  defaultValue: "Change file",
                })
              : t("documents_upload.click_to_select", {
                  defaultValue: "Select file",
                })}
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
        <Button
          variant="secondary"
          size="md"
          onPress={onClose}
          disabled={isUploading}
        >
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
              : t("documents_upload.upload_document", {
                  defaultValue: "Upload document",
                })}
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
  const user = useAuthStore((s) => s.user);
  const isAgent = user?.is_agent ?? false;
  const [activeTab, setActiveTab] = useState<UploadTab>("upload");
  const [WebUpload, setWebUpload] = useState<React.ComponentType<{
    onUploadSuccess?: () => void | Promise<unknown>;
    useCard?: boolean;
  }> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line silverkey/no-platform-feature-check -- Platform.OS selects UI implementation (web DOM vs native picker), not a feature flag
    if (Platform.OS === "web") {
      void import("./DocumentUpload").then((m) =>
        setWebUpload(() => m.default),
      );
    }
  }, []);

  const handleUploadSuccess = useCallback(async () => {
    if (onUploadSuccess) {
      await onUploadSuccess();
    }
    setTimeout(() => onClose(), 500);
  }, [onClose, onUploadSuccess]);

  const handleFormSelect = useCallback(
    async (form: ChecklistForm) => {
      // When a form is selected, download it and treat as uploaded
      // For Phase 1, just show success message
      // Phase 2: Actually create a document record from the form
      alert(
        `Form selected: ${form.title}\n\nPhase 2: This will create a document from the form.`,
      );
      if (onUploadSuccess) {
        await onUploadSuccess();
      }
      onClose();
    },
    [onClose, onUploadSuccess],
  );

  if (!isOpen) return null;

  // eslint-disable-next-line silverkey/no-platform-feature-check -- Select modal body by platform (web DOM form vs native picker form)
  const isWeb = Platform.OS === "web";

  // Native doesn't have forms browser yet
  if (!isWeb) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={t("documents_upload.modal_title", {
          defaultValue: "Upload Document",
        })}
        size="lg"
        showCloseButton
        closeOnBackdropClick
      >
        <DocumentUploadModalNativeBody
          onClose={onClose}
          onUploadSuccess={onUploadSuccess}
        />
      </BaseModal>
    );
  }

  // Web version with tabs (if agent)
  const tabs = isAgent
    ? [
        {
          id: "upload" as const,
          label: t("documents.upload_tab", { defaultValue: "Upload File" }),
        },
        {
          id: "forms" as const,
          label: t("documents.forms_tab", {
            defaultValue: "Select from Forms",
          }),
        },
      ]
    : [
        {
          id: "upload" as const,
          label: t("documents.upload_tab", { defaultValue: "Upload File" }),
        },
      ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("documents_upload.modal_title", {
        defaultValue: "Add Document",
      })}
      size="lg"
      showCloseButton
      closeOnBackdropClick
      closeOnEscape
    >
      {isAgent && (
        <Box className="mb-4">
          <UnderlineTabs
            items={tabs}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as UploadTab)}
            size="sm"
          />
        </Box>
      )}

      {activeTab === "upload" && WebUpload && (
        <WebUpload onUploadSuccess={handleUploadSuccess} useCard={false} />
      )}

      {activeTab === "forms" && isAgent && (
        <Box className="max-h-[60vh] overflow-y-auto">
          <FormsBrowser
            onSelectForm={handleFormSelect}
            onClose={onClose}
            showActions={false}
          />
        </Box>
      )}
    </BaseModal>
  );
}
