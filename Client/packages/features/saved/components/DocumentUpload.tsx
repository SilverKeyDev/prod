import { useCallback, useRef, useState } from "react";

import StatusBadge from "@ui/asset/StatusBadge";
import Button from "@ui/button/Button";
import IconButton from "@ui/button/IconButton";
import type { DropdownOption } from "@ui/form/Dropdown";
import Dropdown from "@ui/form/Dropdown";
import Input from "@ui/form/Input.web";
import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";
import { FileText, Upload } from "lucide-react";

import { useLocalization } from "packages/contexts";
import { useDocuments } from "packages/features/documents";
import { useUIStore } from "packages/store";

import Card from "@/components/layout/Card.web";

type DocumentUploadProps = {
  onUploadSuccess?: () => void | Promise<unknown>;
  /** Whether to wrap content in a Card component */
  useCard?: boolean;
};

export default function DocumentUpload({ onUploadSuccess, useCard = true }: DocumentUploadProps) {
  const { t } = useLocalization();
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const { uploadDocument, documentCategories, categoriesLoading, uploadedFiles } = useDocuments();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert categories to dropdown options
  const categoryOptions: DropdownOption<string>[] = documentCategories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  // Find current upload status for selected file
  const currentUpload = selectedFile
    ? uploadedFiles.find(
        (upload) => upload.file.name === selectedFile.name && upload.file.size === selectedFile.size
      )
    : null;

  const uploadStatus = currentUpload?.status;
  const isUploadComplete = uploadStatus === "completed";
  const isUploadFailed = uploadStatus === "failed";

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !selectedCategory) {
      enqueueToast({
        type: "error",
        message: "Please select both a file and a category",
      });
      return;
    }

    setIsUploading(true);
    try {
      await uploadDocument(
        selectedFile,
        selectedCategory,
        undefined,
        undefined,
        address || undefined
      );
      enqueueToast({
        type: "success",
        message: "Document uploaded successfully",
      });
      // Clear selections
      setSelectedFile(null);
      setSelectedCategory("");
      setAddress("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      // Call success callback to refresh document list
      if (onUploadSuccess) {
        void onUploadSuccess();
      }
    } catch (error) {
      let errorMessage = "Failed to upload document";
      if (error instanceof Error) {
        errorMessage = error.message;
        // If it's an HttpError, try to extract more details
        if ("bodyPreview" in error && typeof error.bodyPreview === "string") {
          try {
            const errorBody = JSON.parse(error.bodyPreview);
            if (errorBody.message) {
              errorMessage = errorBody.message;
            } else if (errorBody.error) {
              errorMessage = errorBody.error;
            }
          } catch {
            // If parsing fails, use the bodyPreview as-is if it's short
            if (error.bodyPreview.length < 200) {
              errorMessage = error.bodyPreview;
            }
          }
        }
      }
      enqueueToast({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, selectedCategory, address, uploadDocument, enqueueToast, onUploadSuccess]);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const canUpload = selectedFile && selectedCategory && !isUploading;

  const content = (
    <div className="space-y-responsive-md">
      <div>
        <Label size="sm" required>
          {t("documents_upload.category_label")}
        </Label>
        <Dropdown
          options={categoryOptions}
          value={selectedCategory}
          onChange={handleCategoryChange}
          placeholder={t("documents_upload.select_category")}
          disabled={categoriesLoading || isUploading}
          required
          variant="mobile"
        />
      </div>

      <div>
        <Label size="sm">{t("documents_upload.address_optional")}</Label>
        <Input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t("documents_upload.placeholder_address")}
          disabled={isUploading}
          variant="mobile"
        />
      </div>

      <div>
        <Label size="sm" required>
          {t("documents_upload.document_file")}
        </Label>
        <div className="relative">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,image/*"
            onChange={handleFileSelect}
            disabled={isUploading}
            className="hidden"
            id="document-upload-input"
          />
          <Label
            htmlFor="document-upload-input"
            className={`touch-friendly gap-responsive-sm p-responsive-md flex cursor-pointer items-center justify-between rounded-lg border-2 border-dashed transition-colors ${
              isUploading
                ? "cursor-not-allowed border-gray-300 bg-gray-50"
                : selectedFile
                  ? "border-brand-accent bg-brand-accent/5"
                  : "hover:border-brand-accent/50 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <div className="gap-responsive-sm flex min-w-0 flex-1 items-center">
              {selectedFile ? (
                <>
                  <FileText className="text-brand-accent h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" />
                  <div className="min-w-0 flex-1">
                    <BodyText size="sm" className="truncate font-medium">
                      {selectedFile.name}
                    </BodyText>
                    <BodyText size="xs" muted>
                      {`${(selectedFile.size / 1024 / 1024).toFixed(2)}${t("common.mb")}`}
                    </BodyText>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 flex-shrink-0 text-gray-400 sm:h-6 sm:w-6" />
                  <div className="min-w-0 flex-1">
                    <BodyText size="sm">{t("documents_upload.click_to_select")}</BodyText>
                    <BodyText size="xs" muted>
                      {t("documents_upload.file_types")}
                    </BodyText>
                  </div>
                </>
              )}
            </div>
            {selectedFile && !isUploading && (
              <IconButton
                variant="ghost"
                size="sm"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClearFile();
                }}
                type="button"
                iconName="x"
                label={t("documents_upload.remove_file_aria")}
              />
            )}
          </Label>
        </div>
      </div>

      {/* Upload Status */}
      {currentUpload && (
        <div className="gap-responsive-sm flex items-center">
          {isUploadComplete ? (
            <StatusBadge variant="success" size="sm" text={t("documents_upload.upload_success")} />
          ) : isUploadFailed ? (
            <StatusBadge variant="error" size="sm" text={t("documents_upload.upload_failed")} />
          ) : (
            <StatusBadge variant="processing" size="sm" text={t("documents_upload.uploading")} />
          )}
        </div>
      )}

      {/* Upload Button */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="md"
          onClick={handleUpload}
          disabled={!canUpload || isUploading}
          loading={isUploading}
          fullWidth
          className="sm:w-auto"
        >
          {isUploading ? t("documents_upload.uploading") : t("documents_upload.upload_document")}
        </Button>
      </div>
    </div>
  );

  if (useCard) {
    return (
      <Card className="mx-auto w-[85%]" padding="md">
        {content}
      </Card>
    );
  }

  return content;
}
