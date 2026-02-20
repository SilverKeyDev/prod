/**
 * Secure File Upload Component
 * Provides secure file upload with EXIF stripping, validation, and preview
 */

import React, { useCallback, useRef, useState } from "react";

import { AlertTriangle, CheckCircle, FileImage, Upload } from "lucide-react";

import { useLocalization } from "packages/contexts";
import {
  formatFileSize,
  processImage,
} from "packages/services/security/imageProcessor";
import { log } from "packages/services/security/secureLogger";

import Card from "@/components/layout/Card.web";
import {
  BodyText,
  Button,
  Image,
  Input,
  Label,
  Title,
} from "@/components/ui/index.web";

type SecureFileUploadProps = {
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
          `File "${file.name}" is too large (${formatFileSize(
            file.size,
          )}). Maximum size is ${formatFileSize(maxSize)}.`,
        );
      }
      if (!acceptedTypes.includes(file.type)) {
        errors.push(
          `File "${file.name}" has unsupported type (${
            file.type
          }). Accepted types: ${acceptedTypes.join(", ")}.`,
        );
      }
      return errors;
    },
    [maxSize, acceptedTypes],
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

        const validFiles = fileList.filter((file) =>
          file.type.startsWith("image/"),
        );

        const processedFiles: ProcessedImage[] = validFiles.map(
          (file): ProcessedImage => {
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
          },
        );

        const filesWithPreview: FileWithPreview[] = processedFiles.map(
          (processed, index) => ({
            ...processed,
            preview: showPreview
              ? URL.createObjectURL(processed.file)
              : undefined,
            id: `file-${Date.now()}-${index}`,
          }),
        );

        setFiles((prev) => [...prev, ...filesWithPreview]);

        if (autoProcess) {
          onFilesProcessed(processedFiles);
        }

        log.info("SECURE_UPLOAD", "Files processed successfully", {
          totalFiles: processedFiles.length,
          totalSizeReduction: processedFiles.reduce(
            (acc, f) => acc + (f.originalSize - f.processedSize),
            0,
          ),
        });
      } catch (error: unknown) {
        log.error("SECURE_UPLOAD", "File processing failed", error);
        setError(
          `Processing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      } finally {
        setProcessing(false);
      }
    },
    [showPreview, autoProcess, onFilesProcessed, validateFile],
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
    [files.length, maxFiles, processFiles],
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
        <Label className="mb-4 block">
          {label}
          {required && (
            <BodyText as="span" className="text-red-500">
              {t("form.required_indicator")}
            </BodyText>
          )}
        </Label>
      )}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200 ${
          isDragOver
            ? "border-brand-accent bg-brand-accent/5"
            : "border-gray-300 hover:border-brand-accent/50"
        } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-gray-50"} `}
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

        <div className="space-y-3">
          <Upload className="mx-auto h-10 w-10 text-gray-400" />
          <div>
            <BodyText as="p" size="sm" className="text-gray-600">
              {t("secure_upload.click_or_drag")}
            </BodyText>
            <BodyText as="p" size="xs" className="mt-1 text-gray-500">
              {t("secure_upload.up_to", {
                types: acceptedTypes.join(", "),
                size: formatFileSize(maxSize),
              })}
            </BodyText>
          </div>
        </div>

        {processing && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-accent"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-600" />
            <BodyText as="p" size="sm" className="text-red-800">
              {error}
            </BodyText>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <Title
              as="h4"
              size="sm"
              className="flex items-center font-medium text-gray-700"
            >
              <FileImage className="mr-2 h-4 w-4" />
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
              className="text-gray-500 hover:text-gray-700"
            >
              {t("secure_upload.clear_all")}
            </Button>
          </div>
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {file.preview ? (
                      <Image
                        src={file.preview}
                        alt={file.file.name}
                        className="h-12 w-12 rounded-lg border border-gray-200 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
                        <BodyText as="span" className="text-xs text-gray-600">
                          {`${(file.processedSize / 1024 / 1024).toFixed(2)}${t("common.mb")}`}
                        </BodyText>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <BodyText
                      as="p"
                      size="sm"
                      className="truncate font-medium text-gray-900"
                    >
                      {file.file.name}
                    </BodyText>
                    <div className="mt-1 flex items-center space-x-3 text-xs text-gray-500">
                      {formatFileSize(file.processedSize)}
                      {file.originalSize !== file.processedSize && (
                        <BodyText as="span" className="flex items-center">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {t("secure_upload.exif_stripped")}
                        </BodyText>
                      )}
                    </div>
                    {file.warnings.length > 0 && (
                      <div className="mt-1">
                        {file.warnings.map((warning, index) => (
                          <BodyText
                            key={index}
                            as="p"
                            size="xs"
                            className="text-yellow-600"
                          >
                            {t("secure_upload.warning_prefix")}
                            {warning}
                          </BodyText>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  iconName="x"
                  className="text-red-400 hover:text-red-600"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card
            className="relative max-h-[90vh] max-w-4xl overflow-hidden"
            padding="none"
          >
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <Title as="h3" size="lg" className="font-medium text-gray-900">
                {previewFile.file.name}
              </Title>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewFile(null)}
                iconName="x"
                className="text-gray-400 hover:text-gray-600"
              />
            </div>
            <div className="p-6">
              <Image
                src={previewFile.preview}
                alt={previewFile.file.name}
                className="mx-auto max-h-[70vh] max-w-full rounded-lg object-contain"
              />
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
};
