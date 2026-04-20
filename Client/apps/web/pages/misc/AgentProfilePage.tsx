import { useEffect, useMemo } from "react";

import { useLocalization } from "packages/contexts";
import { PublicAgentProfileConnect } from "packages/features/agent";
import { AgentPublicProfileView } from "packages/features/profile";
import { usePublicAgentProfile } from "packages/hooks/data/integrations/usePublicAgentProfile";
import { useUserData } from "packages/hooks/data/user/useUserData";
import { useNavigation, useRouteParams } from "packages/navigation";
import { DEFAULT_APP_TITLE } from "packages/navigation/router/pageTitles";
import { useAuthStore } from "packages/store";
import { Loading } from "packages/ui/components/asset/loading/Loading";
import { buildAgentProfileUrl, generateAgentProfileSlug } from "packages/utils/agent";

import { BodyText, Button, Title } from "@/components/ui";
import { Box } from "@/components/ui";

export default function AgentProfilePage() {
  const { t } = useLocalization();
  const { agentId, slug } = useRouteParams<{
    agentId: string;
    slug?: string;
  }>();
  const { navigate, navigateToPath } = useNavigation();
  const authUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { userProfile } = useUserData();
  const viewerId = isAuthenticated ? (userProfile?.id ?? authUser?.id ?? null) : null;
  const isOwnProfile = Boolean(viewerId && agentId && viewerId === agentId.trim());
  const { data: agent, isLoading, isError, error, isFetched } = usePublicAgentProfile(agentId);

  const canonicalSlug = useMemo(() => {
    if (!agent?.name) return null;
    return generateAgentProfileSlug(agent.name);
  }, [agent?.name]);

  useEffect(() => {
    if (!agent?.name || !agentId || !canonicalSlug) return;
    if (slug && slug !== canonicalSlug) {
      navigateToPath(buildAgentProfileUrl(agentId, agent.name), {
        replace: true,
      });
    }
  }, [agent, agentId, slug, canonicalSlug, navigateToPath]);

  useEffect(() => {
    if (agent?.name?.trim()) {
      document.title = `${agent.name.trim()} – ${DEFAULT_APP_TITLE}`;
    }
    return () => {
      document.title = DEFAULT_APP_TITLE;
    };
  }, [agent?.name]);

  if (!agentId?.trim()) {
    return (
      <Box className="flex h-full min-h-[50vh] items-center justify-center p-6">
        <Box className="text-center">
          <Title size="lg" className="mb-4">
            {t("profile.public.agent_not_found_title")}
          </Title>
          <BodyText size="md" muted className="mb-6">
            {t("profile.public.invalid_link_body")}
          </BodyText>
          <Button variant="primary" onClick={() => navigate("HOME")} iconName="home">
            {t("profile.public.back_home")}
          </Button>
        </Box>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
        <Loading message={t("profile.public.loading")} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box className="flex h-full min-h-[50vh] items-center justify-center p-6">
        <Box className="text-center">
          <Title size="lg" className="mb-4">
            {t("profile.public.load_error_title")}
          </Title>
          <BodyText size="md" muted className="mb-6">
            {error instanceof Error ? error.message : t("profile.public.generic_error")}
          </BodyText>
          <Button variant="primary" onClick={() => navigate("HOME")} iconName="home">
            {t("profile.public.back_home")}
          </Button>
        </Box>
      </Box>
    );
  }

  if (isFetched && agent === null) {
    return (
      <Box className="flex h-full min-h-[50vh] items-center justify-center p-6">
        <Box className="text-center">
          <Title size="lg" className="mb-4">
            {t("profile.public.agent_not_found_title")}
          </Title>
          <BodyText size="md" muted className="mb-6">
            {t("profile.public.unavailable_body")}
          </BodyText>
          <Button variant="primary" onClick={() => navigate("HOME")} iconName="home">
            {t("profile.public.back_home")}
          </Button>
        </Box>
      </Box>
    );
  }

  if (!agent) {
    return null;
  }

  return (
    <AgentPublicProfileView
      agent={agent}
      heroActions={<PublicAgentProfileConnect agentId={agent.id} isOwnProfile={isOwnProfile} />}
    />
  );
}
