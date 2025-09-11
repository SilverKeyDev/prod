/**
 * Secure File Upload Component
 * Provides secure file upload with EXIF stripping, validation, and preview
 */

import React, { useState, useRef, useCallback } from "react";
import { Upload, X, FileImage, AlertTriangle, CheckCircle } from "lucide-react";
import Card from "../layout/Card";
import Button from "../ui/button/Button";
import {
  processImage,
  formatFileSize,
} from "../../lib/security/imageProcessor";
import { log } from "../../lib/security/secureLogger";

interface SecureFileUploadProps {
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
}

interface ProcessedImage {
  file: File;
  originalSize: number;
  processedSize: number;
  metadataRemoved: string[];
  warnings: string[];
}

interface FileWithPreview extends ProcessedImage {
  preview?: string;
  id: string;
}

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
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [processing, setProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<FileWithPreview | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateFile = (file: File): string[] => {
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
  };

  const processFiles = async (fileList: File[]) => {
    setProcessing(true);
    setError(null);

    try {
      log.info("SECURE_UPLOAD", "Processing files", { count: fileList.length });

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

      const processedFiles: ProcessedImage[] = await Promise.all(
        validFiles.map(async (file): Promise<ProcessedImage> => {
          try {
            return await processImage(file, {
              maxWidth: 2048,
              maxHeight: 2048,
              quality: 0.8,
              stripAllMetadata: true,
            });
          } catch (error) {
            log.error("SECURE_UPLOAD", "Image processing failed", error);
            return {
              file,
              originalSize: file.size,
              processedSize: file.size,
              metadataRemoved: [],
              warnings: [],
            };
          }
        }),
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
    } catch (error) {
      log.error("SECURE_UPLOAD", "File processing failed", error);
      setError(
        `Processing failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    } finally {
      setProcessing(false);
    }
  };

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
      processFiles(droppedFiles);
    },
    [files.length, maxFiles],
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
    const selectedFiles = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`Too many files. Maximum ${maxFiles} files allowed.`);
      return;
    }
    processFiles(selectedFiles);
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
  }, []);

  return (
    <Card className={`w-full ${className}`} padding="md">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-4">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${
            isDragOver
              ? "border-brand-accent bg-brand-accent/5"
              : "border-gray-300 hover:border-brand-accent/50"
          }
          ${
            disabled
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:bg-gray-50"
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={processing}
          ref={fileInputRef}
        />

        <div className="space-y-3">
          <Upload className="mx-auto h-10 w-10 text-gray-400" />
          <div>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-brand-accent">
                Click to upload
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {acceptedTypes.join(", ")} up to {formatFileSize(maxSize)}
            </p>
          </div>
        </div>

        {processing && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-accent"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <FileImage className="w-4 h-4 mr-2" />
              Uploaded Files ({files.length})
            </h4>
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
              Clear All
            </Button>
          </div>
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-500">
                          {(file.processedSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                      <span>{formatFileSize(file.processedSize)}</span>
                      {file.originalSize !== file.processedSize && (
                        <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          EXIF Stripped
                        </span>
                      )}
                    </div>
                    {file.warnings.length > 0 && (
                      <div className="mt-1">
                        {file.warnings.map((warning, index) => (
                          <p key={index} className="text-xs text-yellow-600">
                            ⚠️ {warning}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.id)}
                  icon={<X className="w-4 h-4" />}
                  className="text-red-400 hover:text-red-600"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card
            className="relative max-w-4xl max-h-[90vh] overflow-hidden"
            padding="none"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {previewFile.file.name}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewFile(null)}
                icon={<X className="h-5 w-5" />}
                className="text-gray-400 hover:text-gray-600"
              />
            </div>
            <div className="p-6">
              <img
                src={previewFile.preview}
                alt={previewFile.file.name}
                className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
              />
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
};
