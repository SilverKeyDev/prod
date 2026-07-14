import { useCallback, useState } from "react";

import { useLocalization } from "packages/contexts";
import { PublicAgentSearchGate } from "packages/features/agent";
import type { AgentPublicProfileViewModel } from "packages/features/profile/utils";
import { PUBLIC_PROFILE_SECTION_IDS } from "packages/features/profile/utils/public/publicProfileSectionIds";
import { SearchLocationBarWeb } from "packages/features/search/components/header/location-bar/SearchLocationBar.web";
import { useGoogleMapsStoreIntegration } from "packages/hooks/store/map/useGoogleMapsStoreIntegration";
import { useNavigation } from "packages/navigation";
import { useAuthStore } from "packages/store";
import { stashPendingPublicSearchFromContext } from "packages/store/slices/growth/publicSearchRouting";
import type { components } from "packages/types/api.generated";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import { getWindow } from "packages/utils/core/platform";

import { PublicProfileSection } from "./PublicProfileSection.web";

type PublicProfileSearchBandProps = {
  agent: components["schemas"]["PublicAgentProfile"];
  model: AgentPublicProfileViewModel;
};

/**
 * "Search homes" band on the public agent profile (`#search`, SIL-291): the
 * regular dashboard search bar (area suggestions + Google Places dropdown)
 * embedded inline. Picking a location stores the search area in the shared
 * search context, then hands off:
 * - signed-in viewers continue to the real dashboard search (`/search`);
 * - anonymous viewers get the sign-in gate, with the agent stored as a
 *   pending connect intent for post-signup attribution.
 */
export function PublicProfileSearchBand({ agent, model }: PublicProfileSearchBandProps) {
  const { t } = useLocalization();
  const { navigate } = useNavigation();
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [gateOpen, setGateOpen] = useState(false);

  // Loads the Google Maps script (public endpoint) for Places autocomplete.
  const { isLoaded: mapsLoaded } = useGoogleMapsStoreIntegration();
  const win = getWindow();
  const scriptsReady =
    !!mapsLoaded &&
    !!(win as unknown as { google?: { maps?: { places?: unknown } } } | undefined)?.google?.maps
      ?.places;

  const handleSearch = useCallback(() => {
    if (!authReady) return;
    // Stash the picked location so the dashboard search restores and runs it —
    // now for signed-in viewers, after signup/onboarding for anonymous ones.
    stashPendingPublicSearchFromContext();
    if (!isAuthenticated) {
      setGateOpen(true);
      return;
    }
    navigate("SEARCH");
  }, [authReady, isAuthenticated, navigate]);

  return (
    <PublicProfileSection
      id={PUBLIC_PROFILE_SECTION_IDS.search}
      heading={
        model.displayName
          ? t("profile.public.site.search_heading", { agentName: model.displayName })
          : t("profile.public.site.search_heading_generic")
      }
      tone="surface"
      compact
      centered
    >
      <Box className="mx-auto flex w-full max-w-2xl flex-col gap-2">
        <SearchLocationBarWeb
          scriptsReady={scriptsReady}
          fitMapToBounds={() => {}}
          onSearch={handleSearch}
          locationPlaceholder={t("profile.public.site.search_placeholder")}
        />
        <BodyText size="sm" muted>
          {t("profile.public.site.search_body")}
        </BodyText>
      </Box>
      <PublicAgentSearchGate
        isOpen={gateOpen}
        onClose={() => setGateOpen(false)}
        agentId={agent.id}
        agentName={agent.name ?? undefined}
        agentPhotoUrl={agent.profile_picture_url ?? agent.professional_headshot_url ?? undefined}
      />
    </PublicProfileSection>
  );
}
