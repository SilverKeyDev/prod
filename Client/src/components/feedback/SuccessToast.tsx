import { X } from 'lucide-react';
import React, { useState, useEffect } from 'react';

type SuccessToastProps = {
  message: string;
  onClose: () => void;
  duration?: number;
};

export default function SuccessToast({ message, onClose, duration = 3000 }: SuccessToastProps) {
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
    <div className="fixed bottom-2 right-2 z-50 sm:bottom-4 sm:right-4">
      <div className="space-responsive-sm max-w-xs rounded-lg border border-green-200 bg-green-50 sm:max-w-md">
        <div className="gap-responsive-sm flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-responsive-sm font-medium text-green-800">Success</p>
            <p className="text-responsive-xs mt-1 break-words text-green-700">{message}</p>
          </div>
          <button
            onClick={() => {
              setVisible(false);
              onClose();
            }}
            className="space-responsive-xs flex-shrink-0 touch-manipulation text-green-500 transition-colors hover:text-green-700"
          >
            <X className="mobile-icon-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
