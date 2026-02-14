import { useState, useRef } from "react";
import { Upload, File, X } from "lucide-react";
import { Button, BodyText } from "../../../../components/ui";
import { useDocusignActions } from "../../../../../../packages/hooks/data/documents/useDocusignActions";
import { useUIStore } from "../../../../../../packages/store";

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
  agreementId,
  onSuccess,
  onCancel,
}: RevisionUploadProps) {
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
        message:
          error instanceof Error ? error.message : "Failed to upload revision",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* File Upload Area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Document (PDF)
        </label>

        {!selectedFile ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <BodyText size="sm" muted>
              Click to upload or drag and drop
            </BodyText>
            <BodyText size="xs" muted className="mt-1">
              PDF only, max 10MB
            </BodyText>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-gray-400 hover:text-gray-600"
              disabled={isCreatingRevision}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this revision..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          disabled={isCreatingRevision}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            variant="outline"
            size="md"
            onClick={onCancel}
            disabled={isCreatingRevision}
          >
            Cancel
          </Button>
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
