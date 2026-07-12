import type { ReactNode } from "react";

import { useLocalization } from "packages/contexts";
import { LandingNav } from "packages/features/homeauth/components/homepage/landing/nav/LandingNav.web";
import { scrollToLandingSection } from "packages/features/homeauth/utils/landingScroll";
import { PUBLIC_PROFILE_SECTION_IDS } from "packages/features/profile/utils/public/publicProfileSectionIds";
import { Link, useNavigation } from "packages/navigation";
import { useAuthStore } from "packages/store";
import { Box, Button } from "packages/ui";
import { LANDING_NAV_MAIN_OFFSET_CLASS } from "packages/utils/product/homeauth/landingChrome";

type AgentPublicProfileShellProps = {
  children: ReactNode;
};

const NAV_LINK_CLASS =
  "text-text-secondary hover:text-text-primary inline-flex min-h-11 items-center border-b-2 border-transparent px-2 text-sm font-semibold motion-safe:transition-colors";

/**
 * Public-site chrome for agent profile pages (`/a/:publicSlug` and
 * `/agent-profile/...`): the marketing landing nav above the page content.
 *
 * Center links (desktop) scroll to the page sections: About (`#about`) and
 * Search homes (`#search`, SIL-291). Nav end actions by viewer:
 * - authenticated (any user) → "Back to dashboard"
 * - unauthenticated → default landing cluster (Login / Sign up / Book a demo)
 *
 * The Connect flow for non-owner viewers stays in the page hero.
 */
export function AgentPublicProfileShell({ children }: AgentPublicProfileShellProps) {
  const { t } = useLocalization();
  const { navigate } = useNavigation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const centerLinks = (
    <>
      <Link
        to={`#${PUBLIC_PROFILE_SECTION_IDS.about}`}
        className={NAV_LINK_CLASS}
        onClick={(e) => {
          e.preventDefault();
          scrollToLandingSection(PUBLIC_PROFILE_SECTION_IDS.about);
        }}
      >
        {t("profile.public.site.nav_about")}
      </Link>
      <Link
        to={`#${PUBLIC_PROFILE_SECTION_IDS.search}`}
        className={NAV_LINK_CLASS}
        onClick={(e) => {
          e.preventDefault();
          scrollToLandingSection(PUBLIC_PROFILE_SECTION_IDS.search);
        }}
      >
        {t("profile.public.site.nav_search")}
      </Link>
    </>
  );

  const endActions = isAuthenticated ? (
    <Button variant="primary" size="sm" iconName="arrow-left" onPress={() => navigate("DASHBOARD")}>
      {t("profile.public.back_to_dashboard")}
    </Button>
  ) : undefined;

  return (
    <Box className="bg-background-base min-h-screen">
      <LandingNav endActions={endActions} variant="publicAgent" centerLinks={centerLinks} />
      <main className={LANDING_NAV_MAIN_OFFSET_CLASS}>{children}</main>
    </Box>
  );
}
