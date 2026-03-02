import { useEffect, useState } from "react";

import { X } from "lucide-react";

import { useLocalization } from "packages/contexts";
import IconButton from "packages/ui/components/button/IconButton";
import BodyText from "packages/ui/components/text/BodyText";

type SuccessToastProps = {
  message: string;
  onClose: () => void;
  duration?: number;
};

export default function SuccessToast({ message, onClose, duration = 3000 }: SuccessToastProps) {
  const { t } = useLocalization();
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
            <BodyText as="p" size="sm" className="text-responsive-sm font-medium text-green-800">
              {t("feedback.success_title")}
            </BodyText>
            <BodyText
              as="p"
              size="xs"
              className="text-responsive-xs mt-1 break-words text-green-700"
            >
              {message}
            </BodyText>
          </div>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={() => {
              setVisible(false);
              onClose();
            }}
            className="flex-shrink-0 text-green-500 hover:text-green-700"
            aria-label={t("feedback.close_aria")}
          >
            <X className="mobile-icon-sm" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
