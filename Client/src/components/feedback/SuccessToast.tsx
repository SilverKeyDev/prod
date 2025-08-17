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
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-800 font-medium">Success</p>
            <p className="text-green-700 text-sm mt-1">{message}</p>
          </div>
          <button
            onClick={() => {
              setVisible(false);
              onClose();
            }}
            className="text-green-500 hover:text-green-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
