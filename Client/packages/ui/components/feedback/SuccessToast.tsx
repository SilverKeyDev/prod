import { useEffect, useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import IconButton from "packages/ui/components/button/IconButton";
import { Box } from "packages/ui/components/primitives";
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
    <Box className="z-toast fixed bottom-1.5 right-1.5 sm:bottom-2 sm:right-2">
      <Box className="border-border max-w-xs rounded-lg border bg-green-50 p-2 sm:max-w-md">
        <Box className="gap-responsive-sm flex items-start justify-between">
          {message ? (
            <BodyText
              as="p"
              size="sm"
              className="text-responsive-sm min-w-0 flex-1 break-words font-medium text-green-800"
            >
              {message}
            </BodyText>
          ) : (
            <Box className="min-w-0 flex-1" />
          )}
          <IconButton
            variant="ghost"
            size="sm"
            label={t("feedback.close_aria")}
            onClick={() => {
              setVisible(false);
              onClose();
            }}
            className="flex-shrink-0 text-green-500 hover:text-green-700"
          >
            <Icon name="x" className="mobile-icon-sm" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
