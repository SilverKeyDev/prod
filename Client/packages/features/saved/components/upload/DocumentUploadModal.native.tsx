import React, { useCallback, useMemo, useState } from "react";

import Button from "@ui/button/Button";
import * as DocumentPicker from "expo-document-picker";

import { useLocalization } from "packages/contexts";
import { useDocuments } from "packages/features/documents";
import { useUIStore } from "packages/store";
import { BaseModal } from "packages/ui/components/modals";
import { Box, PrimitiveInput, Text } from "packages/ui/components/primitives";

type DocumentUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void | Promise<unknown>;
};

type PickerAsset = DocumentPicker.DocumentPickerAsset;

type UploadableFile = File & {
  uri?: string;
};

export default function DocumentUploadModalNative({
  isOpen,
  onClose,
  onUploadSuccess,
}: DocumentUploadModalProps) {
  const { t } = useLocalization();
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  const { documentCategories, categoriesLoading, uploadDocument, refreshCategories } =
    useDocuments();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [address, setAddress] = useState("");
  const [selectedFile, setSelectedFile] = useState<PickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const categoryOptions = useMemo(
    () =>
      documentCategories.map((cat) => ({
        id: cat.id,
        label: cat.name,
      })),
    [documentCategories]
  );

  const handlePickFile = useCallback(async () => {
    try {
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
    if (!selectedFile || !selectedFile.uri || !selectedCategoryId) {
      enqueueToast({
        type: "error",
        message: t("documents_upload.missing_fields", {
          defaultValue: "Please select a category and a file to upload.",
        }),
      });
      return;
    }

    setIsUploading(true);

    try {
      const pseudoFile: UploadableFile = {
        // The FormData implementation in React Native accepts an object
        // with uri, name, and type fields as a file value.
        uri: selectedFile.uri,
        name: selectedFile.name ?? "document",
        type: selectedFile.mimeType ?? "application/octet-stream",
        size: selectedFile.size ?? 0,
      } as UploadableFile;

      await uploadDocument(
        pseudoFile,
        selectedCategoryId,
        undefined,
        undefined,
        address || undefined
      );

      enqueueToast({
        type: "success",
        message: t("documents_upload.upload_success", {
          defaultValue: "Document uploaded successfully",
        }),
      });

      setSelectedFile(null);
      setSelectedCategoryId("");
      setAddress("");

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
  }, [
    address,
    enqueueToast,
    onClose,
    onUploadSuccess,
    selectedCategoryId,
    selectedFile,
    t,
    uploadDocument,
  ]);

  const handleRefreshCategories = useCallback(async () => {
    try {
      await refreshCategories();
    } catch {
      // Silent failure; categories query already logs via documentService
    }
  }, [refreshCategories]);

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("documents_upload.modal_title", {
        defaultValue: "Upload Document",
      })}
      showCloseButton
      closeOnBackdropClick={!isUploading}
    >
      <Box className="gap-4">
        <Box className="gap-2">
          <Text className="text-sm font-medium text-gray-900">
            {t("documents_upload.category_label", { defaultValue: "Category" })}
          </Text>
          <Box className="flex flex-row flex-wrap gap-2">
            {categoryOptions.map((cat) => {
              const isSelected = cat.id === selectedCategoryId;
              return (
                <Button
                  key={cat.id}
                  variant={isSelected ? "primary" : "secondary"}
                  size="sm"
                  disabled={categoriesLoading || isUploading}
                  onPress={() => setSelectedCategoryId(cat.id)}
                  className="px-3 py-2"
                >
                  <Text
                    className={`text-sm font-medium ${isSelected ? "text-white" : "text-gray-800"}`}
                  >
                    {cat.label}
                  </Text>
                </Button>
              );
            })}
            {!categoriesLoading && categoryOptions.length === 0 && (
              <Text className="text-xs text-gray-600">
                {t("documents_upload.no_categories", {
                  defaultValue: "No categories available.",
                })}
              </Text>
            )}
          </Box>
          {categoriesLoading && (
            <Text className="text-xs text-gray-500">
              {t("documents_upload.loading_categories", {
                defaultValue: "Loading categories…",
              })}
            </Text>
          )}
          {!categoriesLoading && categoryOptions.length > 0 && (
            <Button
              variant="ghost"
              size="xs"
              onPress={handleRefreshCategories}
              disabled={isUploading}
              className="self-start"
            >
              <Text className="text-xs text-blue-600">
                {t("documents_upload.refresh_categories", {
                  defaultValue: "Refresh categories",
                })}
              </Text>
            </Button>
          )}
        </Box>

        <Box className="gap-2">
          <Text className="text-sm font-medium text-gray-900">
            {t("documents_upload.address_optional", {
              defaultValue: "Property address (optional)",
            })}
          </Text>
          <PrimitiveInput
            value={address}
            onValueChange={setAddress}
            placeholder={t("documents_upload.placeholder_address", {
              defaultValue: "e.g., 123 Main St, San Francisco, CA",
            })}
            editable={!isUploading}
          />
        </Box>

        <Box className="gap-3">
          <Text className="text-sm font-medium text-gray-900">
            {t("documents_upload.document_file", {
              defaultValue: "Document file",
            })}
          </Text>
          <Button variant="secondary" size="md" onPress={handlePickFile} disabled={isUploading}>
            <Text className="text-sm font-medium text-gray-900">
              {selectedFile
                ? (selectedFile.name ??
                  t("documents_upload.change_file", {
                    defaultValue: "Change file",
                  }))
                : t("documents_upload.click_to_select", {
                    defaultValue: "Select file",
                  })}
            </Text>
          </Button>
          {selectedFile && (
            <Text className="text-xs text-gray-600">
              {selectedFile.name}{" "}
              {selectedFile.size != null
                ? `(${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`
                : ""}
            </Text>
          )}
        </Box>

        <Box className="mt-2 flex flex-row justify-end gap-3">
          <Button variant="secondary" size="md" onPress={onClose} disabled={isUploading}>
            <Text className="text-sm font-medium text-gray-900">
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Text>
          </Button>
          <Button
            variant="primary"
            size="md"
            onPress={handleUpload}
            disabled={!selectedFile || !selectedCategoryId || isUploading}
          >
            <Text className="text-sm font-medium text-white">
              {isUploading
                ? t("documents_upload.uploading", {
                    defaultValue: "Uploading…",
                  })
                : t("documents_upload.upload_document", {
                    defaultValue: "Upload document",
                  })}
            </Text>
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
}
