import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

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
    <div className="fixed inset-0 z-[9999] overflow-y-auto" style={{ left: 0, right: 0, top: 0, bottom: 0 }}>
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-6" style={{ width: '100vw', height: '100vh' }}>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onCancel}
          style={{ left: 0, right: 0, top: 0, bottom: 0 }}
        />
        
        {/* Dialog */}
        <div className="relative z-[10000] w-full max-w-sm mx-auto transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all" style={{ maxWidth: '320px' }}>
          {/* Close button */}
          <button
            type="button"
            onClick={onCancel}
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-500 touch-friendly"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Content */}
          <div className="flex items-start justify-center">
            <div className="mt-3 text-center w-full">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">{message}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-brown px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-brown/90 focus:outline-none focus:ring-2 focus:ring-brown/50 focus:ring-offset-2 sm:w-auto touch-friendly min-w-[100px]"
            >
              {confirmText}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-black shadow-sm hover:bg-gray-50 hover:text-black focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 sm:w-auto touch-friendly min-w-[100px]"
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
