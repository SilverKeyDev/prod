import { X } from "lucide-react";
import { createPortal } from "react-dom";

type ConfirmationDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const dialogContent = (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto"
      style={{ left: 0, right: 0, top: 0, bottom: 0 }}
    >
      <div
        className="space-responsive-md flex min-h-screen items-center justify-center"
        style={{ width: "100vw", height: "100vh" }}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onCancel}
          style={{ left: 0, right: 0, top: 0, bottom: 0 }}
        />

        {/* Dialog */}
        <div
          className="space-responsive-lg relative z-[10000] mx-auto w-full max-w-sm transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all"
          style={{ maxWidth: "320px" }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onCancel}
            className="touch-friendly absolute right-2 top-2 text-gray-400 hover:text-gray-500"
          >
            <X className="mobile-icon-md" aria-hidden="true" />
          </button>

          {/* Content */}
          <div className="flex items-start justify-center">
            <div className="mt-3 w-full text-center">
              <h3 className="text-responsive-lg font-medium leading-6 text-gray-900">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-responsive-sm text-gray-500">{message}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="gap-responsive-sm mt-5 flex flex-col justify-center sm:mt-6 sm:flex-row">
            <button
              type="button"
              onClick={onConfirm}
              className="px-responsive-lg py-responsive-sm text-responsive-sm touch-friendly inline-flex w-full min-w-[100px] justify-center rounded-md border border-transparent bg-brown font-medium text-white shadow-sm hover:bg-brown/90 focus:outline-none focus:ring-2 focus:ring-brown/50 focus:ring-offset-2 sm:w-auto"
            >
              {confirmText}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-responsive-lg py-responsive-sm text-responsive-sm touch-friendly inline-flex w-full min-w-[100px] justify-center rounded-md border border-gray-300 bg-white font-medium text-black shadow-sm hover:bg-gray-50 hover:text-black focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 sm:w-auto"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render the dialog using a portal to ensure it appears at the document root level
  return createPortal(dialogContent, document.body);
}
