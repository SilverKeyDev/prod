import { useEffect, useMemo } from "react";

import { useLocalization } from "packages/contexts";
import { PublicAgentProfileConnect } from "packages/features/agent";
import { AgentPublicProfileView } from "packages/features/profile";
import { usePublicAgentProfile } from "packages/hooks/data/integrations/usePublicAgentProfile";
import { useUserData } from "packages/hooks/data/user/useUserData";
import { getRouteSeoMeta, useNavigation, useRouteParams } from "packages/navigation";
import { DEFAULT_APP_TITLE } from "packages/navigation/router/pageTitles";
import { useAuthStore } from "packages/store";
import { Loading } from "packages/ui/components/asset/loading/Loading";
import {
  buildAgentProfileUrl,
  generateAgentProfileSlug,
  resolveAgentProfileRouteParams,
} from "packages/utils/agent";

import { applySocialMetaTags } from "@/app/seo/documentMeta";
import { setJsonLdScript } from "@/app/seo/jsonLd";
import { getSiteOrigin } from "@/app/seo/siteOrigin";
import { BodyText, Button, Title } from "@/components/ui";
import { Box } from "@/components/ui";

export default function AgentProfilePage() {
  const { t } = useLocalization();
  const { briefSlug, name: nameSegment } = useRouteParams<{
    name: string;
    briefSlug: string;
  }>();
  const { agentUserId, legacyUuidFirst } = useMemo(
    () => resolveAgentProfileRouteParams(nameSegment, briefSlug),
    [briefSlug, nameSegment]
  );
  const agentId = agentUserId ?? undefined;
  const { navigate, navigateToPath, getCurrentRoute } = useNavigation();
  const { pathname, search } = getCurrentRoute();
  const authUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { userProfile } = useUserData();
  const viewerId = isAuthenticated ? (userProfile?.id ?? authUser?.id ?? null) : null;
  const isOwnProfile = Boolean(viewerId && agentId && viewerId === agentId.trim());
  const { data: agent, isLoading, isError, error, isFetched } = usePublicAgentProfile(agentId);

  const canonicalNameSlug = useMemo(() => {
    if (!agent?.name) return null;
    return generateAgentProfileSlug(agent.name);
  }, [agent?.name]);

  useEffect(() => {
    if (!agent?.name || !agentId || !canonicalNameSlug) return;
    const pathName = nameSegment?.trim();
    if (legacyUuidFirst || (pathName && pathName !== canonicalNameSlug)) {
      navigateToPath(buildAgentProfileUrl(agentId, agent.name), {
        replace: true,
      });
    }
  }, [agent, agentId, canonicalNameSlug, legacyUuidFirst, nameSegment, navigateToPath]);

  useEffect(() => {
    if (!agent?.name?.trim()) {
      setJsonLdScript("seo-agent-person", null);
      return;
    }
    const title = `${agent.name.trim()} – ${DEFAULT_APP_TITLE}`;
    document.title = title;
    const origin = getSiteOrigin() || (typeof window !== "undefined" ? window.location.origin : "");
    const pageUrl = origin ? `${origin}${pathname}${search}` : "";
    const fallbackDesc = getRouteSeoMeta(pathname).description;
    const desc =
      (agent.agent_bio ?? "").trim().slice(0, 160) || agent.brokerage_name?.trim() || fallbackDesc;
    const rawImage = agent.profile_picture_url ?? agent.professional_headshot_url ?? "";
    const imageUrl =
      rawImage && /^https?:\/\//i.test(rawImage)
        ? rawImage
        : origin
          ? `${origin}/og-default.png`
          : "/og-default.png";
    if (pageUrl) {
      applySocialMetaTags({ title, description: desc, imageUrl, pageUrl });
    }
    const sameAs =
      agent.social_links &&
      Object.values(agent.social_links).filter((u): u is string => typeof u === "string");
    setJsonLdScript("seo-agent-person", {
      "@context": "https://schema.org",
      "@type": "Person",
      name: agent.name.trim(),
      url: pageUrl || undefined,
      image: imageUrl,
      jobTitle: "Real Estate Agent",
      worksFor: agent.brokerage_name
        ? { "@type": "Organization", name: agent.brokerage_name }
        : undefined,
      sameAs: sameAs && sameAs.length ? sameAs : undefined,
    });
    return () => {
      setJsonLdScript("seo-agent-person", null);
    };
  }, [agent, pathname, search]);

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
