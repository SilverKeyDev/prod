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
  buildShortPublicProfilePath,
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
  const {
    publicSlug,
    briefSlug,
    name: nameSegment,
  } = useRouteParams<{
    publicSlug?: string;
    name?: string;
    briefSlug?: string;
  }>();
  const routeSlug = publicSlug?.trim() ?? "";

  const { agentUserId, legacyUuidFirst } = useMemo(() => {
    if (routeSlug) {
      return { agentUserId: null, legacyUuidFirst: false };
    }
    return resolveAgentProfileRouteParams(nameSegment, briefSlug);
  }, [routeSlug, nameSegment, briefSlug]);

  const profileQueryUserId = agentUserId ?? undefined;

  const {
    data: agent,
    isLoading,
    isError,
    error,
    isFetched,
  } = usePublicAgentProfile(
    routeSlug ? { publicProfileSlug: routeSlug } : { userId: profileQueryUserId }
  );

  const agentId = useMemo(
    () => (routeSlug ? agent?.id?.trim() : profileQueryUserId?.trim()) ?? "",
    [routeSlug, agent?.id, profileQueryUserId]
  );

  const hasLookup = Boolean(routeSlug) || Boolean(profileQueryUserId?.trim());

  const { getCurrentRoute, navigate, navigateToPath } = useNavigation();
  const { pathname, search } = getCurrentRoute();
  const authUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { userProfile } = useUserData();
  const viewerId = isAuthenticated ? (userProfile?.id ?? authUser?.id ?? null) : null;
  const isOwnProfile = Boolean(viewerId && agent?.id && viewerId === agent.id.trim());

  const canonicalNameSlug = useMemo(() => {
    if (!agent?.name) return null;
    return generateAgentProfileSlug(agent.name);
  }, [agent?.name]);

  useEffect(() => {
    if (!agent?.name || !agent.id) return;
    const shortSlug = agent.public_profile_slug?.trim();
    const { state } = getCurrentRoute();

    if (shortSlug) {
      const target = buildShortPublicProfilePath(shortSlug);
      if (pathname !== target) {
        navigateToPath(target, { replace: true, state });
      }
      return;
    }

    if (!canonicalNameSlug || !agentId) return;
    const pathName = nameSegment?.trim();
    if (legacyUuidFirst || (pathName && pathName !== canonicalNameSlug)) {
      navigateToPath(buildAgentProfileUrl(agent.id, agent.name), {
        replace: true,
        state,
      });
    }
  }, [
    agent,
    agentId,
    canonicalNameSlug,
    getCurrentRoute,
    legacyUuidFirst,
    nameSegment,
    navigateToPath,
    pathname,
  ]);

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

  if (!hasLookup) {
    return (
      <Box className="flex h-full min-h-[50vh] flex-col">
        <Box className="flex flex-1 flex-col items-center justify-center p-6">
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
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box className="flex min-h-[50vh] flex-col">
        <Box className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <Loading message={t("profile.public.loading")} />
        </Box>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box className="flex h-full min-h-[50vh] flex-col">
        <Box className="flex flex-1 flex-col items-center justify-center p-6">
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
      </Box>
    );
  }

  if (isFetched && agent === null) {
    return (
      <Box className="flex h-full min-h-[50vh] flex-col">
        <Box className="flex flex-1 flex-col items-center justify-center p-6">
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
      </Box>
    );
  }

  if (!agent) {
    return <Box className="min-h-[20vh]" />;
  }

  return (
    <AgentPublicProfileView
      agent={agent}
      heroActions={
        <PublicAgentProfileConnect
          agentId={agent.id}
          isOwnProfile={isOwnProfile}
          agentName={agent.name ?? undefined}
          agentPhotoUrl={
            agent.profile_picture_url ?? agent.professional_headshot_url ?? undefined
          }
        />
      }
    />
  );
}
