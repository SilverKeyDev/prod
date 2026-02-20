type DeleteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
};

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Report",
  message = "Are you sure you want to delete this report? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
}: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="space-responsive-sm fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="space-responsive-sm mx-4 w-full max-w-md rounded-xl bg-white">
        <div className="text-center">
          <div className="mobile-icon-lg space-y-responsive-sm mx-auto flex items-center justify-center rounded-full bg-red-100">
            <svg
              className="mobile-icon-sm text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-responsive-lg space-y-responsive-xs font-medium text-gray-900">
            {title}
          </h3>
          <p className="text-responsive-sm space-y-responsive-md text-gray-500">
            {message}
          </p>
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="focus:ring-brown-500 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
