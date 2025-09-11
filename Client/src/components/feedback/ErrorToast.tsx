import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ErrorToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function ErrorToast({
  message,
  onClose,
  duration = 5000,
}: ErrorToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-2 sm:bottom-4 right-2 sm:right-4 z-50">
      <div className="bg-red-50 border border-red-200 rounded-lg space-responsive-sm max-w-xs sm:max-w-md">
        <div className="flex items-start justify-between gap-responsive-sm">
          <div className="flex-1 min-w-0">
            <p className="text-red-800 font-medium text-responsive-sm">Error</p>
            <p className="text-red-700 text-responsive-xs mt-1 break-words">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0 touch-manipulation space-responsive-xs"
          >
            <X className="mobile-icon-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
