import { useEffect, useState } from "react";

import { X } from "lucide-react";

import { useLocalization } from "packages/contexts";

import { BodyText, IconButton } from "@/components/ui/index.web";

type ErrorToastProps = {
  message: string;
  onClose: () => void;
  duration?: number;
};

export default function ErrorToast({
  message,
  onClose,
  duration = 5000,
}: ErrorToastProps) {
  const { t } = useLocalization();
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
            <BodyText
              as="p"
              size="sm"
              className="font-medium text-red-800 text-responsive-sm"
            >
              {t("feedback.error_title")}
            </BodyText>
            <BodyText
              as="p"
              size="xs"
              className="mt-1 break-words text-red-700 text-responsive-xs"
            >
              {message}
            </BodyText>
          </div>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex-shrink-0 text-red-500 hover:text-red-700"
            aria-label={t("feedback.close_aria")}
          >
            <X className="mobile-icon-sm" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}
