import type { ReactNode } from "react";

import { useLocalization } from "packages/contexts";
import { LandingNav } from "packages/features/homeauth/components/homepage/landing/nav/LandingNav.web";
import { LANDING_NAV_MAIN_OFFSET_CLASS } from "packages/features/homeauth/utils/landingChrome";
import { Link, ROUTES, useNavigation } from "packages/navigation";
import { useAuthStore } from "packages/store";
import { Box, Button } from "packages/ui";
import { MINI_LOGO } from "packages/ui/components/media/asset";
import { Image } from "packages/ui/components/structure/primitives";

type AgentPublicProfileShellProps = {
  children: ReactNode;
};

/**
 * Public-site chrome for agent profile pages (`/a/:publicSlug` and
 * `/agent-profile/...`): the marketing landing nav above the page content.
 *
 * Nav end actions by viewer:
 * - authenticated (any user) → "Back to dashboard"
 * - unauthenticated → SilverKey-branded "Login" button
 *
 * The Connect flow for non-owner viewers stays in the page hero.
 */
export function AgentPublicProfileShell({
  children,
}: AgentPublicProfileShellProps) {
  const { t } = useLocalization();
  const { navigate } = useNavigation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const endActions = isAuthenticated ? (
    <Button
      variant="primary"
      size="sm"
      iconName="arrow-left"
      onPress={() => navigate("DASHBOARD")}
    >
      {t("profile.public.back_to_dashboard")}
    </Button>
  ) : (
    <Link to={ROUTES.LOGIN}>
      <Button variant="primary" size="sm" className="gap-2">
        <Image
          src={MINI_LOGO}
          alt=""
          className="h-4 w-4 shrink-0 object-contain"
        />
        {t("profile.public.nav_login")}
      </Button>
    </Link>
  );

  return (
    <Box className="bg-background-base min-h-screen">
      <LandingNav endActions={endActions} showSectionLinks={false} />
      <main className={LANDING_NAV_MAIN_OFFSET_CLASS}>{children}</main>
    </Box>
  );
}
