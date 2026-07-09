import { type ReactNode, useMemo } from "react";

import { useLocalization } from "packages/contexts";
import { PublicProfileHero } from "packages/features/profile/components/publicSite/PublicProfileHero.web";
import { PublicProfileSearchBand } from "packages/features/profile/components/publicSite/PublicProfileSearchBand.web";
import { PublicProfileSocial } from "packages/features/profile/components/publicSite/PublicProfileSocial.web";
import { PublicProfileTestimonials } from "packages/features/profile/components/publicSite/PublicProfileTestimonials.web";
import { buildAgentPublicProfileViewModel } from "packages/features/profile/utils";
import type { components } from "packages/types/api.generated";
import { Box } from "packages/ui/components/structure/primitives";

export type AgentPublicProfileViewProps = {
  agent: components["schemas"]["PublicAgentProfile"];
  /** Optional actions in the hero row (e.g. public Connect CTA). */
  heroActions?: ReactNode;
};

/**
 * Public agent site layout (web): landing-style full-width sections instead of
 * the stacked card layout the native app keeps (`AgentPublicProfileView.tsx`).
 *
 * Structure: one identity hero (`#about`: name, bio, credentials fine print)
 * → inline search bar (`#search`, SIL-291: picking a place hands off to the
 * dashboard search, or the sign-in gate when anonymous) → testimonials
 * (`#testimonials`, SIL-289) → social links. Contact channels are
 * deliberately not rendered in the body — visitors reach the agent via the
 * hero Connect CTA. The `#listings` anchor arrives with SIL-290.
 */
export function AgentPublicProfileView({
  agent,
  heroActions,
}: AgentPublicProfileViewProps) {
  const { t } = useLocalization();
  const fallbackName = t("profile.public.hero_fallback_name");
  const model = useMemo(
    () => buildAgentPublicProfileViewModel(agent, fallbackName),
    [agent, fallbackName],
  );

  return (
    <Box className="w-full">
      <PublicProfileHero
        agent={agent}
        model={model}
        heroActions={heroActions}
      />
      <PublicProfileSearchBand agent={agent} model={model} />
      <PublicProfileTestimonials model={model} />
      <PublicProfileSocial model={model} />
    </Box>
  );
}
