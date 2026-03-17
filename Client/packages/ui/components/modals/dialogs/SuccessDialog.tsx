import { spacing } from "packages/design-tokens";
import { Portal } from "packages/ui/components/portal";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Button, Title } from "@/components/ui";

type SuccessDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
};

export default function SuccessDialog({
  isOpen,
  title,
  message,
  confirmText = "Continue",
  onConfirm,
}: SuccessDialogProps) {
  if (!isOpen) return null;

  const dialogContent = (
    <Box className="fixed inset-0 z-50 overflow-y-auto">
      <Box
        className="space-responsive-md flex min-h-screen items-center justify-center"
        style={{ width: "100vw", height: "100vh" }}
      >
        {/* Backdrop */}
        <Box className="bg-overlay-backdrop fixed inset-0 transition-opacity" />

        {/* Dialog */}
        <Box
          className="space-responsive-lg relative z-50 mx-auto w-full max-w-sm transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all"
          style={{ maxWidth: spacing(80) }}
        >
          {/* Success Icon */}
          <Box className="mobile-icon-xl mx-auto mb-4 flex items-center justify-center rounded-full bg-green-100">
            <svg
              className="mobile-icon-lg text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </Box>

          {/* Content */}
          <Box className="text-center">
            <Title size="lg" as="h3" className="mb-2">
              {title}
            </Title>
            <BodyText size="sm" muted className="mb-6">
              {message}
            </BodyText>
          </Box>

          {/* Action */}
          <Box className="flex justify-center">
            <Button type="button" variant="primary" size="md" onClick={onConfirm}>
              {confirmText}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return <Portal>{dialogContent}</Portal>;
}
