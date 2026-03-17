/**
 * Secure File Upload Component
 * Provides secure file upload with EXIF stripping, validation, and preview
 */
import React, { useCallback, useRef, useState } from "react";

import Button from "@ui/button/Button";
import Input from "@ui/form/Input";
import { Icon } from "@ui/icons";
import Card from "@ui/layout/Card.web";
import BodyText from "@ui/text/BodyText";
import Label from "@ui/text/Label.web";
import Title from "@ui/text/Title";

import { useLocalization } from "packages/contexts";
import { formatFileSize, processImage } from "packages/services/security/imageProcessor";
import { log } from "packages/services/security/secureLogger";
import { DROP_ZONE_BORDER_BASE } from "packages/ui/components/form/fileUploadStyles";
import { Box, Image } from "packages/ui/components/primitives";
import { CARD_TRANSITION_CLASSES } from "packages/ui/styles/transitions/transitionClasses";
export type SecureFileUploadProps = {
  onFilesProcessed: (files: ProcessedImage[]) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  autoProcess?: boolean;
  showPreview?: boolean;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};
type ProcessedImage = {
  file: File;
  originalSize: number;
  processedSize: number;
  metadataRemoved: string[];
  warnings: string[];
};
type FileWithPreview = {
  preview?: string;
  id: string;
} & ProcessedImage;
export const SecureFileUpload: React.FC<SecureFileUploadProps> = ({
  onFilesProcessed,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp"],
  autoProcess = true,
  showPreview = true,
  label,
  required,
  disabled,
  className = "",
}) => {
  const { t } = useLocalization();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [processing, setProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileWithPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const validateFile = useCallback(
    (file: File): string[] => {
      const errors: string[] = [];
      if (file.size > maxSize) {
        errors.push(
          `File "${file.name}" is too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(maxSize)}.`
        );
      }
      if (!acceptedTypes.includes(file.type)) {
        errors.push(
          `File "${file.name}" has unsupported type (${file.type}). Accepted types: ${acceptedTypes.join(", ")}.`
        );
      }
      return errors;
    },
    [maxSize, acceptedTypes]
  );
  const processFiles = useCallback(
    (fileList: File[]) => {
      setProcessing(true);
      setError(null);
      try {
        log.info("SECURE_UPLOAD", "Processing files", {
          count: fileList.length,
        });
        const validationErrors: string[] = [];
        fileList.forEach((file) => {
          validationErrors.push(...validateFile(file));
        });
        if (validationErrors.length > 0) {
          setError(validationErrors.join(", "));
          setProcessing(false);
          return;
        }
        const validFiles = fileList.filter((file) => file.type.startsWith("image/"));
        const processedFiles: ProcessedImage[] = validFiles.map((file): ProcessedImage => {
          try {
            return processImage(file, {
              maxWidth: 2048,
              maxHeight: 2048,
              quality: 0.8,
              stripAllMetadata: true,
            });
          } catch (error: unknown) {
            log.error("SECURE_UPLOAD", "Image processing failed", error);
            return {
              file,
              originalSize: file.size,
              processedSize: file.size,
              metadataRemoved: [],
              warnings: [],
            };
          }
        });
        const filesWithPreview: FileWithPreview[] = processedFiles.map((processed, index) => ({
          ...processed,
          preview: showPreview ? URL.createObjectURL(processed.file) : undefined,
          id: `file-${Date.now()}-${index}`,
        }));
        setFiles((prev) => [...prev, ...filesWithPreview]);
        if (autoProcess) {
          onFilesProcessed(processedFiles);
        }
        log.info("SECURE_UPLOAD", "Files processed successfully", {
          totalFiles: processedFiles.length,
          totalSizeReduction: processedFiles.reduce(
            (acc, f) => acc + (f.originalSize - f.processedSize),
            0
          ),
        });
      } catch (error: unknown) {
        log.error("SECURE_UPLOAD", "File processing failed", error);
        setError(`Processing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setProcessing(false);
      }
    },
    [showPreview, autoProcess, onFilesProcessed, validateFile]
  );
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (files.length + droppedFiles.length > maxFiles) {
        setError(`Too many files. Maximum ${maxFiles} files allowed.`);
        return;
      }
      void processFiles(droppedFiles);
    },
    [files.length, maxFiles, processFiles]
  );
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Too many files. Maximum ${maxFiles} files allowed.`);
      return;
    }
    void processFiles(selectedFiles);
  };
  const removeFile = (id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };
  React.useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);
  return (
    <Card className={`w-full ${className}`} padding="md">
      {label && (
        <Label className="mb-4 flex flex-col">
          {label}
          {required && (
            <BodyText as="span" className="text-red-500">
              {t("form.required_indicator")}
            </BodyText>
          )}
        </Label>
      )}

      <Box
        role="button"
        tabIndex={disabled ? -1 : 0}
        className={`relative ${DROP_ZONE_BORDER_BASE} p-6 text-center ${CARD_TRANSITION_CLASSES} ${isDragOver ? "border-primary bg-primary-muted" : "hover:border-primary active:border-primary border-border"} ${disabled ? "bg-disabled text-text-disabled cursor-not-allowed" : "hover:bg-accent-muted cursor-pointer active:bg-neutral-100"} active:bg-accent-muted`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <Input
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInput}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          disabled={processing}
          ref={fileInputRef}
        />

        <Box className="flex flex-col gap-3">
          <Icon name="upload" className="h-10 w-10 self-center text-gray-400" />
          <Box>
            <BodyText as="p" size="sm" className="text-gray-600">
              {t("secure_upload.click_or_drag")}
            </BodyText>
            <BodyText as="p" size="xs" className="mt-1 text-gray-500">
              {t("secure_upload.up_to", {
                types: acceptedTypes.join(", "),
                size: formatFileSize(maxSize),
              })}
            </BodyText>
          </Box>
        </Box>

        {processing && (
          <Box className="absolute inset-0 flex flex-row items-center justify-center bg-white bg-opacity-75">
            <Box className="border-brand-accent h-8 w-8 animate-spin rounded-full border-b-2"></Box>
          </Box>
        )}
      </Box>

      {error && (
        <Box className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <Box className="flex flex-row items-center gap-2">
            <Icon name="alert-triangle" className="h-4 w-4 flex-shrink-0 text-red-600" />
            <BodyText as="p" size="sm" className="text-red-800">
              {error}
            </BodyText>
          </Box>
        </Box>
      )}

      {files.length > 0 && (
        <Box className="mt-6 flex flex-col gap-4">
          <Box className="flex flex-row items-center justify-between">
            <Title
              as="h4"
              size="sm"
              className="flex flex-row items-center font-medium text-gray-700"
            >
              <Icon name="file-image" className="mr-2 h-4 w-4" />
              {t("secure_upload.uploaded_files", { count: files.length })}
            </Title>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                files.forEach((file) => {
                  if (file.preview) URL.revokeObjectURL(file.preview);
                });
                setFiles([]);
                setError(null);
              }}
              className="text-gray-500 hover:text-gray-700 active:text-gray-700 active:text-gray-800"
            >
              {t("secure_upload.clear_all")}
            </Button>
          </Box>
          <Box className="flex flex-col gap-3">
            {files.map((file) => (
              <Box
                key={file.id}
                className="border-border bg-primary-muted flex flex-row items-center justify-between rounded-lg border p-4"
              >
                <Box className="flex flex-row items-center gap-4">
                  <Box className="flex-shrink-0">
                    {file.preview ? (
                      <Image
                        src={file.preview}
                        alt={file.file.name}
                        className="border-border h-12 w-12 rounded-lg border object-cover"
                      />
                    ) : (
                      <Box className="flex h-12 w-12 flex-row items-center justify-center rounded-lg bg-gray-200">
                        <BodyText as="span" className="text-xs text-gray-600">
                          {`${(file.processedSize / 1024 / 1024).toFixed(2)}${t("common.mb")}`}
                        </BodyText>
                      </Box>
                    )}
                  </Box>
                  <Box className="min-w-0 flex-1">
                    <BodyText as="p" size="sm" className="truncate font-medium text-gray-900">
                      {file.file.name}
                    </BodyText>
                    <Box className="mt-1 flex flex-row items-center gap-3 text-xs text-gray-500">
                      {formatFileSize(file.processedSize)}
                      {file.originalSize !== file.processedSize && (
                        <BodyText as="span" className="flex flex-row items-center">
                          <Icon name="check-circle" className="mr-1 h-3 w-3" />
                          {t("secure_upload.exif_stripped")}
                        </BodyText>
                      )}
                    </Box>
                    {file.warnings.length > 0 && (
                      <Box className="mt-1">
                        {file.warnings.map((warning, index) => (
                          <BodyText key={index} as="p" size="xs" className="text-yellow-600">
                            {t("secure_upload.warning_prefix")}
                            {warning}
                          </BodyText>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  iconName="x"
                  className="text-red-400 hover:text-red-600 active:text-red-600 active:text-red-700"
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {previewFile && (
        <Box className="fixed inset-0 z-50 flex flex-row items-center justify-center bg-neutral-900 p-4">
          <Card
            className="relative max-h-full min-h-0 max-w-4xl flex-1 overflow-hidden"
            padding="none"
          >
            <Box className="border-border flex flex-row items-center justify-between border-b p-4">
              <Title as="h3" size="lg" className="font-medium text-gray-900">
                {previewFile.file.name}
              </Title>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewFile(null)}
                iconName="x"
                className="text-gray-400 hover:text-gray-600 active:text-gray-600 active:text-gray-700"
              />
            </Box>
            <Box className="p-6">
              <Image
                src={previewFile.preview}
                alt={previewFile.file.name}
                className="max-h-96 max-w-full self-center rounded-lg object-contain"
              />
            </Box>
          </Card>
        </Box>
      )}
    </Card>
  );
};
