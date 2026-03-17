import { useEffect, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import IconButton from "packages/ui/components/button/IconButton";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
type ErrorToastProps = {
  message: string;
  onClose: () => void;
  duration?: number;
};
export default function ErrorToast({ message, onClose, duration = 5000 }: ErrorToastProps) {
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
    <Box className="fixed bottom-2 right-2 z-50 sm:bottom-4 sm:right-4">
      <Box className="space-responsive-sm max-w-xs rounded-lg border border-red-200 bg-red-50 sm:max-w-md">
        <Box className="gap-responsive-sm flex items-start justify-between">
          <Box className="min-w-0 flex-1">
            <BodyText as="p" size="sm" className="text-responsive-sm font-medium text-red-800">
              {t("feedback.error_title")}
            </BodyText>
            <BodyText as="p" size="xs" className="text-responsive-xs mt-1 break-words text-red-700">
              {message}
            </BodyText>
          </Box>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex-shrink-0 text-red-500 hover:text-red-700"
            aria-label={t("feedback.close_aria")}
          >
            <Icon name="x" className="mobile-icon-sm" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
