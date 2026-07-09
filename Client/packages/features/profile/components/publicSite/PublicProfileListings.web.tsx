import { useLocalization } from "packages/contexts";
import type { PublicAgentListing } from "packages/features/profile/hooks/data/usePublicAgentListings";
import { usePublicAgentListings } from "packages/features/profile/hooks/data/usePublicAgentListings";
import { PUBLIC_PROFILE_SECTION_IDS } from "packages/features/profile/utils/public/publicProfileSectionIds";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";

import { PublicListingCard } from "./PublicListingCard.web";
import {
  PublicProfileEyebrow,
  PublicProfileSection,
} from "./PublicProfileSection.web";

const GRID_CLASS = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
const SKELETON_CARD_CLASS =
  "border-border bg-background-surface h-64 animate-pulse rounded-2xl border";

function ListingsGroup({
  heading,
  listings,
  emptyBody,
}: {
  heading: string;
  listings: PublicAgentListing[];
  /** Rendered instead of the grid when the bucket is empty; omit to hide the group. */
  emptyBody?: string;
}) {
  if (listings.length === 0 && !emptyBody) return null;
  return (
    <Box className="flex flex-col gap-5">
      <PublicProfileEyebrow>{heading}</PublicProfileEyebrow>
      {listings.length ? (
        <Box className={GRID_CLASS}>
          {listings.map((listing) => (
            <PublicListingCard key={listing.id} listing={listing} />
          ))}
        </Box>
      ) : (
        <BodyText size="sm" muted>
          {emptyBody}
        </BodyText>
      )}
      <Box className="border-border/60 mt-3 border-t" aria-hidden />
    </Box>
  );
}

type PublicProfileListingsProps = {
  agentId: string;
};

/**
 * `#listings` section of the public agent site (SIL-290): the agent's MLS
 * listings split into current (active) and former (sold/closed). Empty-state
 * copy when the agent has no MLS-linked listings; hidden on hard load errors
 * (public surface stays quiet). MLS-attributed cards only — no partner
 * placement on this surface.
 */
export function PublicProfileListings({ agentId }: PublicProfileListingsProps) {
  const { t } = useLocalization();
  const { current, former, data, isPending, isError } =
    usePublicAgentListings(agentId);

  // 404 (not a public agent) or transport error: the rest of the page already
  // handles messaging; a broken band adds nothing for visitors.
  if (isError || data === null) return null;

  return (
    <PublicProfileSection
      id={PUBLIC_PROFILE_SECTION_IDS.listings}
      heading={t("profile.public.listings.heading")}
    >
      {isPending ? (
        <Box className={GRID_CLASS} aria-hidden>
          {[0, 1, 2].map((i) => (
            <Box key={i} className={SKELETON_CARD_CLASS} />
          ))}
        </Box>
      ) : current.length === 0 && former.length === 0 ? (
        <BodyText size="md" muted>
          {t("profile.public.listings.empty")}
        </BodyText>
      ) : (
        <Box className="mt-4 flex flex-col gap-8">
          <ListingsGroup
            heading={t("profile.public.listings.current_heading")}
            listings={current}
            emptyBody={t("profile.public.listings.current_empty")}
          />
          <ListingsGroup
            heading={t("profile.public.listings.former_heading")}
            listings={former}
          />
        </Box>
      )}
    </PublicProfileSection>
  );
}
