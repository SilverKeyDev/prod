import { useCallback, useState } from "react";

import { useLocalization } from "packages/contexts";
import { useUserData } from "packages/hooks/data/user/useUserData";
import { useNavigation } from "packages/navigation";
import { useAuthStore, useUIStore } from "packages/store";
import { Button } from "packages/ui";
import { ProfileAvatar } from "packages/ui/components/avatar/ProfileAvatar";
import BaseModal from "packages/ui/components/modals/BaseModal";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";
import { setPendingPublicAgentConnect } from "packages/utils/agent";

import { useConnectionRequests } from "@/features/agent/hooks/data/useConnectionRequests";
import { connectionRequestApiErrorMessage } from "@/features/agent/utils/connectionRequestApiError";

export type PublicAgentProfileConnectProps = {
  agentId: string;
  /** When the signed-in viewer is the agent who owns this public profile. */
  isOwnProfile: boolean;
  /** Display name of the agent — used in the modal and stored as pending intent metadata. */
  agentName?: string;
  /** Profile photo URL for the agent — shown in the modal and stored as pending intent metadata. */
  agentPhotoUrl?: string;
};

export function PublicAgentProfileConnect({
  agentId,
  isOwnProfile,
  agentName,
  agentPhotoUrl,
}: PublicAgentProfileConnectProps) {
  const { t } = useLocalization();
  const { navigate } = useNavigation();
  const authReady = useAuthStore((s) => s.authReady);
  const authUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { userProfile } = useUserData();
  const { createRequestAsInitiator, isCreatingRequest } = useConnectionRequests();
  const enqueueToast = useUIStore((s) => s.enqueueToast);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const initiatorId = userProfile?.id ?? authUser?.id ?? null;
  const initiatorIsAgent = userProfile?.is_agent ?? authUser?.is_agent ?? false;

  const sendConnectRequest = useCallback(async () => {
    if (!initiatorId) {
      enqueueToast({
        type: "error",
        message: t("profile.public.connect_profile_not_ready"),
      });
      return;
    }
    try {
      const { alreadyPending } = await createRequestAsInitiator(
        initiatorId,
        agentId,
        initiatorIsAgent,
        undefined
      );
      if (alreadyPending) {
        enqueueToast({
          type: "warning",
          message: t("profile.public.connect_toast_pending"),
        });
      } else {
        enqueueToast({
          type: "success",
          message: t("profile.public.connect_toast_success"),
        });
      }
      navigate("DASHBOARD", undefined, { replace: true });
    } catch (err: unknown) {
      enqueueToast({
        type: "error",
        message: connectionRequestApiErrorMessage(err, t("profile.public.connect_request_error")),
      });
    }
  }, [agentId, createRequestAsInitiator, enqueueToast, initiatorId, initiatorIsAgent, navigate, t]);

  const handleConnectPress = useCallback(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    void sendConnectRequest();
  }, [authReady, isAuthenticated, sendConnectRequest]);

  const handleSignIn = useCallback(() => {
    setPendingPublicAgentConnect(agentId, { name: agentName, photoUrl: agentPhotoUrl });
    setAuthModalOpen(false);
    // Navigate directly to login with no return path — the resume hook will handle
    // sending the connection request after auth and navigate to DASHBOARD cleanly.
    navigate("LOGIN");
  }, [agentId, agentName, agentPhotoUrl, navigate]);

  const handleCreateAccount = useCallback(() => {
    setPendingPublicAgentConnect(agentId, { name: agentName, photoUrl: agentPhotoUrl });
    setAuthModalOpen(false);
    navigate("SIGNUP");
  }, [agentId, agentName, agentPhotoUrl, navigate]);

  if (isOwnProfile) {
    return null;
  }

  const connectDisabled = !authReady || (isAuthenticated && !initiatorId) || isCreatingRequest;

  const modalTitle = agentName
    ? t("profile.public.connect_modal_title_with_agent", { agentName })
    : t("profile.public.connect_modal_title");

  const modalBody = agentName
    ? t("profile.public.connect_modal_body_with_agent", { agentName })
    : t("profile.public.connect_modal_body");

  return (
    <>
      <Box className="w-full shrink-0 sm:w-auto">
        <Button
          variant="primary"
          size="md"
          onPress={handleConnectPress}
          disabled={connectDisabled}
          loading={isCreatingRequest}
          label={t("profile.public.connect_cta")}
        >
          {t("profile.public.connect_cta")}
        </Button>
      </Box>

      <BaseModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title={modalTitle}
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
    </>
  );
}
