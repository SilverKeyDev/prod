import { createPortal } from 'react-dom';

type SuccessDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
};

export default function SuccessDialog({
  isOpen,
  title,
  message,
  confirmText = 'Continue',
  onConfirm,
}: SuccessDialogProps) {
  if (!isOpen) return null;

  const dialogContent = (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto"
      style={{ left: 0, right: 0, top: 0, bottom: 0 }}
    >
      <div
        className="space-responsive-md flex min-h-screen items-center justify-center"
        style={{ width: '100vw', height: '100vh' }}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          style={{ left: 0, right: 0, top: 0, bottom: 0 }}
        />

        {/* Dialog */}
        <div
          className="space-responsive-lg relative z-[10000] mx-auto w-full max-w-sm transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all"
          style={{ maxWidth: '320px' }}
        >
          {/* Success Icon */}
          <div className="mobile-icon-xl mx-auto mb-4 flex items-center justify-center rounded-full bg-green-100">
            <svg
              className="mobile-icon-lg text-green-600"
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
            <h3 className="text-responsive-lg mb-2 font-medium leading-6 text-gray-900">{title}</h3>
            <p className="text-responsive-sm mb-6 text-gray-500">{message}</p>
          </div>

          {/* Action */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onConfirm}
              className="px-responsive-lg py-responsive-sm text-responsive-sm touch-friendly inline-flex min-w-[120px] justify-center rounded-md border border-transparent bg-brown font-medium text-white shadow-sm hover:bg-brown/90 focus:outline-none focus:ring-2 focus:ring-brown/50 focus:ring-offset-2"
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
