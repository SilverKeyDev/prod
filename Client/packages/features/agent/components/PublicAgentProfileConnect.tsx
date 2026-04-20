import { useCallback, useState } from "react";

import { useLocalization } from "packages/contexts";
import { useUserData } from "packages/hooks/data/user/useUserData";
import { useNavigation } from "packages/navigation";
import { useAuthStore, useUIStore } from "packages/store";
import Button from "packages/ui/components/button/Button";
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
};

export function PublicAgentProfileConnect({
  agentId,
  isOwnProfile,
}: PublicAgentProfileConnectProps) {
  const { t } = useLocalization();
  const { navigate, getCurrentRoute } = useNavigation();
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
        return;
      }
      enqueueToast({
        type: "success",
        message: t("profile.public.connect_toast_success"),
      });
    } catch (err: unknown) {
      enqueueToast({
        type: "error",
        message: connectionRequestApiErrorMessage(err, t("profile.public.connect_request_error")),
      });
    }
  }, [agentId, createRequestAsInitiator, enqueueToast, initiatorId, initiatorIsAgent, t]);

  const handleConnectPress = useCallback(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    void sendConnectRequest();
  }, [authReady, isAuthenticated, sendConnectRequest]);

  const handleSignIn = useCallback(() => {
    setPendingPublicAgentConnect(agentId);
    const { pathname, search } = getCurrentRoute();
    const returnPath = `${pathname}${search ?? ""}`;
    setAuthModalOpen(false);
    navigate("LOGIN", undefined, {
      state: { from: { pathname: returnPath } },
    });
  }, [agentId, getCurrentRoute, navigate]);

  const handleCreateAccount = useCallback(() => {
    setPendingPublicAgentConnect(agentId);
    setAuthModalOpen(false);
    navigate("SIGNUP");
  }, [agentId, navigate]);

  if (isOwnProfile) {
    return null;
  }

  const connectDisabled = !authReady || (isAuthenticated && !initiatorId) || isCreatingRequest;

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
        title={t("profile.public.connect_modal_title")}
        size="sm"
        showCloseButton
      >
        <Box className="gap-4">
          <BodyText size="sm" className="text-text-secondary">
            {t("profile.public.connect_modal_body")}
          </BodyText>
          <Box className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
              variant="secondary"
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
