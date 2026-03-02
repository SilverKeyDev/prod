import { useRef, useState } from "react";

import { File, Upload, X } from "lucide-react";

import { useDocusignActions } from "packages/features/documents/hooks/data/useDocusignActions";
import { useUIStore } from "packages/store";
import {
  BodyText,
  Button,
  CancelButton,
  Input,
  Label,
  Textarea,
} from "packages/ui/components/index.web";

type RevisionUploadProps = {
  agreementId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

/**
 * RevisionUpload Component
 *
 * Allows agents to upload new revisions (PDF files) for draft agreements
 * Includes file picker, notes field, and progress indicator
 */
export default function RevisionUpload({ agreementId, onSuccess, onCancel }: RevisionUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  const { createRevision, isCreatingRevision } = useDocusignActions();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      enqueueToast({
        type: "error",
        message: "Only PDF files are allowed",
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      enqueueToast({
        type: "error",
        message: "File size must be less than 10MB",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      enqueueToast({
        type: "error",
        message: "Please select a file to upload",
      });
      return;
    }

    try {
      await createRevision({
        agreementId,
        file: selectedFile,
        notes: notes.trim() || undefined,
      });

      enqueueToast({
        type: "success",
        message: "Revision uploaded successfully",
      });

      // Reset form
      setSelectedFile(null);
      setNotes("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      enqueueToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to upload revision",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* File Upload Area */}
      <div>
        <Label htmlFor="revision-upload-file" className="mb-2 block font-medium text-gray-700">
          Upload Document (PDF)
        </Label>

        {!selectedFile ? (
          <div
            role="button"
            tabIndex={0}
            className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-6 text-center transition-colors hover:border-gray-400"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <BodyText size="sm" muted>
              Click to upload or drag and drop
            </BodyText>
            <BodyText size="xs" muted className="mt-1">
              PDF only, max 10MB
            </BodyText>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-gray-300 p-4">
            <div className="flex items-center gap-3">
              <File className="h-5 w-5 text-gray-600" />
              <div>
                <BodyText as="p" size="sm" className="font-medium text-gray-900">
                  {selectedFile.name}
                </BodyText>
                <BodyText as="p" size="xs" className="text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </BodyText>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="h-auto min-w-0 p-0 text-gray-400 hover:text-gray-600"
              disabled={isCreatingRevision}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}

        <Input
          id="revision-upload-file"
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="revision-upload-notes" className="mb-2 block font-medium text-gray-700">
          Notes (Optional)
        </Label>
        <Textarea
          id="revision-upload-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this revision..."
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          disabled={isCreatingRevision}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <CancelButton size="md" onClick={onCancel} disabled={isCreatingRevision}>
            Cancel
          </CancelButton>
        )}
        <Button
          variant="primary"
          size="md"
          onClick={handleUpload}
          disabled={!selectedFile || isCreatingRevision}
        >
          {isCreatingRevision ? "Uploading..." : "Upload Revision"}
        </Button>
      </div>
    </div>
  );
}
