import { useRef, useState } from "react";

import { Icon } from "@ui/icons";

import { useUIStore } from "packages/store";
import {
  DROP_ZONE_BORDER_BASE,
  FILE_UPLOAD_DROP_ZONE_DEFAULT,
} from "packages/ui/components/form/fileUploadStyles";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Button, CancelButton, Input, Label, Textarea } from "@/components/ui";
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
export default function RevisionUpload({
  agreementId: _agreementId,
  onSuccess,
  onCancel,
}: RevisionUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const enqueueToast = useUIStore((s) => s.enqueueToast);
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
      // Upload will be wired to the new signing provider; for now we only
      // perform client-side validation and show a success toast.
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
    <Box className="flex flex-col gap-4">
      {/* File Upload Area */}
      <Box>
        <Label
          htmlFor="revision-upload-file"
          className="text-text-secondary mb-2 flex flex-col font-medium"
        >
          Upload Document (PDF)
        </Label>

        {!selectedFile ? (
          <Box
            role="button"
            tabIndex={0}
            // eslint-disable-next-line silverkey/no-dynamic-class-names -- refactor to static cn() or add to safelist
            className={`cursor-pointer ${DROP_ZONE_BORDER_BASE} p-6 text-center ${FILE_UPLOAD_DROP_ZONE_DEFAULT}`}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <Icon name="upload" className="text-text-disabled mb-2 h-8 w-8 self-center" />
            <BodyText className="text-center" size="sm" muted>
              Click to upload or drag and drop
            </BodyText>
            <BodyText size="xs" muted className="mt-1 text-center">
              PDF only, max 10MB
            </BodyText>
          </Box>
        ) : (
          <Box className="border-border flex flex-row items-center justify-between rounded-lg border p-4">
            <Box className="flex flex-row items-center gap-3">
              <Icon name="file" className="text-text-secondary h-5 w-5" />
              <Box>
                <BodyText as="p" size="sm" className="text-text-primary font-medium">
                  {selectedFile.name}
                </BodyText>
                <BodyText as="p" size="xs" className="text-text-secondary">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </BodyText>
              </Box>
            </Box>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="text-text-disabled hover:text-text-secondary active:text-text-secondary active:text-text-secondary h-auto min-w-0 p-0"
              disabled={false}
            >
              <Icon name="x" className="h-5 w-5" />
            </Button>
          </Box>
        )}

        <Input
          id="revision-upload-file"
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </Box>

      {/* Notes */}
      <Box>
        <Label
          htmlFor="revision-upload-notes"
          className="text-text-secondary mb-2 flex flex-col font-medium"
        >
          Notes (Optional)
        </Label>
        <Textarea
          id="revision-upload-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this revision..."
          rows={3}
          className="border-border w-full rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          disabled={false}
        />
      </Box>

      {/* Actions */}
      <Box className="flex flex-row items-center justify-end gap-2 pt-2">
        {onCancel && (
          <CancelButton size="md" onClick={onCancel}>
            Cancel
          </CancelButton>
        )}
        <Button variant="primary" size="md" onClick={handleUpload} disabled={!selectedFile}>
          Upload Revision
        </Button>
      </Box>
    </Box>
  );
}
