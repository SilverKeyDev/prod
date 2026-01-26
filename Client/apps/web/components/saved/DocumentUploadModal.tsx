import { useState } from "react";

import BaseModal from "../modals/BaseModal";
import DocumentUpload from "./DocumentUpload";

type DocumentUploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void | Promise<unknown>;
};

export default function DocumentUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: DocumentUploadModalProps) {
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleUploadSuccess = async () => {
    setUploadSuccess(true);
    if (onUploadSuccess) {
      await onUploadSuccess();
    }
    // Close modal after a brief delay to show success state
    setTimeout(() => {
      setUploadSuccess(false);
      onClose();
    }, 500);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Document"
      size="lg"
      showCloseButton
      closeOnBackdropClick
      closeOnEscape
    >
      <DocumentUpload onUploadSuccess={handleUploadSuccess} useCard={false} />
    </BaseModal>
  );
}
