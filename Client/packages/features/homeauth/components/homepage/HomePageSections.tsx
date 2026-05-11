import { Icon } from "@ui/icons";

import { Box } from "packages/ui/components/primitives";

import { BodyText, Button, CloseButton } from "@/components/ui";

export function HomePageAuthModal({
  onClose,
  onLogin,
  onSignUp,
}: {
  onClose: () => void;
  onLogin: () => void;
  onSignUp: () => void;
}) {
  return (
    <Box className="space-responsive-sm bg-overlay-backdrop z-modal fixed-modal-dashboard-main flex items-center justify-center">
      <Box className="space-responsive-lg bg-background-surface w-full max-w-md rounded-2xl shadow">
        <Box className="mb-4 flex justify-between">
          <Box className="gap-responsive-xs flex items-center">
            <Icon name="lock" className="mobile-icon-sm text-text-secondary" />
            Account Required
          </Box>
          <CloseButton onClick={onClose} />
        </Box>
        <BodyText size="sm" muted className="mb-4 text-center">
          Please log in or create an account to generate a report.
        </BodyText>
        <Box className="flex gap-2 sm:gap-3">
          <Button onClick={onLogin} variant="outline" size="md" fullWidth>
            Login
          </Button>
          <Button onClick={onSignUp} variant="primary" size="md" fullWidth>
            Sign Up
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
