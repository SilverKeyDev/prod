import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface SuccessToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function SuccessToast({
  message,
  onClose,
  duration = 3000,
}: SuccessToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-2 sm:bottom-4 right-2 sm:right-4 z-50">
      <div className="bg-green-50 border border-green-200 rounded-lg space-responsive-sm max-w-xs sm:max-w-md">
        <div className="flex items-start justify-between gap-responsive-sm">
          <div className="flex-1 min-w-0">
            <p className="text-green-800 font-medium text-responsive-sm">Success</p>
            <p className="text-green-700 text-responsive-xs mt-1 break-words">{message}</p>
          </div>
          <button
            onClick={() => {
              setVisible(false);
              onClose();
            }}
            className="text-green-500 hover:text-green-700 transition-colors flex-shrink-0 touch-manipulation space-responsive-xs"
          >
            <X className="mobile-icon-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
