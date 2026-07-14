import { useCallback } from "react";

import { useLocalization } from "packages/contexts";
import { useNavigation } from "packages/navigation";
import { Button } from "packages/ui";
import { ProfileAvatar } from "packages/ui/components/media/avatar/ProfileAvatar";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import BaseModal from "packages/ui/components/surfaces/modals/BaseModal";
import { setPendingPublicAgentConnect } from "packages/utils/growth/agent";

export type PublicAgentSearchGateProps = {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  /** Display name of the agent — used in the modal and stored as pending intent metadata. */
  agentName?: string;
  /** Profile photo URL for the agent — shown in the modal and stored as pending intent metadata. */
  agentPhotoUrl?: string;
};

/**
 * Sign-in gate modal for the search bar on public agent pages (SIL-291).
 *
 * Anonymous visitors can type and pick a location, but continuing into the
 * real dashboard search requires an account. Both buttons store the agent as
 * a pending connect intent, completed after onboarding by
 * `useResumePendingAgentPublicConnect` — same flow as the profile page
 * Connect CTA (`PublicAgentProfileConnect`).
 */
export function PublicAgentSearchGate({
  isOpen,
  onClose,
  agentId,
  agentName,
  agentPhotoUrl,
}: PublicAgentSearchGateProps) {
  const { t } = useLocalization();
  const { navigate } = useNavigation();

  const handleSignIn = useCallback(() => {
    setPendingPublicAgentConnect(agentId, { name: agentName, photoUrl: agentPhotoUrl });
    onClose();
    // Navigate to login; pending intent is completed after onboarding via useResumePendingAgentPublicConnect.
    navigate("LOGIN");
  }, [agentId, agentName, agentPhotoUrl, navigate, onClose]);

  const handleCreateAccount = useCallback(() => {
    setPendingPublicAgentConnect(agentId, { name: agentName, photoUrl: agentPhotoUrl });
    onClose();
    navigate("SIGNUP");
  }, [agentId, agentName, agentPhotoUrl, navigate, onClose]);

  const modalBody = agentName
    ? t("profile.public.search_gate_body_with_agent", { agentName })
    : t("profile.public.search_gate_body");

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("profile.public.search_gate_title")}
      size="sm"
      showCloseButton
      showHeaderBorder
    >
      <Box className="flex flex-col gap-6">
        {agentName ? (
          <Box className="flex items-center gap-3">
            <Box className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
              <ProfileAvatar
                imageUrl={agentPhotoUrl}
                label={agentName}
                imageClassName="h-full w-full object-cover"
              />
            </Box>
            <BodyText size="sm" className="text-text-secondary leading-relaxed">
              {modalBody}
            </BodyText>
          </Box>
        ) : (
          <BodyText size="sm" className="text-text-secondary whitespace-pre-line leading-relaxed">
            {modalBody}
          </BodyText>
        )}
        <Box className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
          <Button
            variant="primary"
            size="md"
            className="min-h-11 w-full sm:flex-1"
            onPress={handleSignIn}
            label={t("profile.public.connect_sign_in")}
          >
            {t("profile.public.connect_sign_in")}
          </Button>
          <Button
            variant="outline"
            size="md"
            className="min-h-11 w-full sm:flex-1"
            onPress={handleCreateAccount}
            label={t("profile.public.connect_create_account")}
          >
            {t("profile.public.connect_create_account")}
          </Button>
        </Box>
      </Box>
    </BaseModal>
  );
}
