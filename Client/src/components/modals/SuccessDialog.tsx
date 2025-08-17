import { createPortal } from "react-dom";

interface SuccessDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
}

export default function SuccessDialog({
  isOpen,
  title,
  message,
  confirmText = "Continue",
  onConfirm,
}: SuccessDialogProps) {
  if (!isOpen) return null;

  const dialogContent = (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto"
      style={{ left: 0, right: 0, top: 0, bottom: 0 }}
    >
      <div
        className="flex min-h-screen items-center justify-center p-4 sm:p-6"
        style={{ width: "100vw", height: "100vh" }}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          style={{ left: 0, right: 0, top: 0, bottom: 0 }}
        />

        {/* Dialog */}
        <div
          className="relative z-[10000] w-full max-w-sm mx-auto transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all"
          style={{ maxWidth: "320px" }}
        >
          {/* Success Icon */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Content */}
          <div className="text-center">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
          </div>

          {/* Action */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex justify-center rounded-md border border-transparent bg-brown px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-brown/90 focus:outline-none focus:ring-2 focus:ring-brown/50 focus:ring-offset-2 touch-friendly min-w-[120px]"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
