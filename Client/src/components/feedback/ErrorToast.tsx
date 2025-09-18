import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

type ErrorToastProps = {
  message: string;
  onClose: () => void;
  duration?: number;
};

export default function ErrorToast({ message, onClose, duration = 5000 }: ErrorToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-2 right-2 z-50 sm:bottom-4 sm:right-4">
      <div className="space-responsive-sm max-w-xs rounded-lg border border-red-200 bg-red-50 sm:max-w-md">
        <div className="gap-responsive-sm flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-responsive-sm font-medium text-red-800">Error</p>
            <p className="text-responsive-xs mt-1 break-words text-red-700">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="space-responsive-xs flex-shrink-0 touch-manipulation text-red-500 transition-colors hover:text-red-700"
          >
            <X className="mobile-icon-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
