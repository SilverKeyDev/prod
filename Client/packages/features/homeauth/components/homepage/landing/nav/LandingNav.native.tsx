import { useLandingActiveSection } from "packages/features/homeauth/hooks/useLandingActiveSection";
import { openLandingBookDemo } from "packages/features/homeauth/utils/landingBookDemo";
import {
  LANDING_GOLD_SIGNUP_BUTTON_CLASS,
  LANDING_NAV_SCROLL_MARGIN_CLASS,
} from "packages/features/homeauth/utils/landingChrome";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { HomeHashLink, homeLandingSectionIdFromHref, Link, ROUTES } from "packages/navigation";
import { MINI_LOGO } from "packages/ui/components/media/asset";
import { Box, Image } from "packages/ui/components/structure/primitives";

import { BodyText, Button, Title } from "@/components/ui";

export function LandingNav() {
  const { nav } = LANDING_CONTENT;
  const activeSectionId = useLandingActiveSection();

  return (
    <Box
      className={`safe-top border-border z-header bg-background-base/95 fixed left-0 right-0 top-0 border-b backdrop-blur-md ${LANDING_NAV_SCROLL_MARGIN_CLASS}`}
    >
      <Box className="px-responsive-sm mx-auto flex h-14 max-w-6xl items-center justify-between gap-3">
        <Link to="/" className="flex shrink-0 touch-manipulation items-center gap-2">
          <Image src={MINI_LOGO} alt={nav.landmarkLabel} className="h-9 w-9 object-contain" />
          <Title as="span" size="sm" className="!text-brand-primary !font-serif font-bold">
            {nav.landmarkLabel}
          </Title>
        </Link>

        <Box className="hidden flex-1 items-center justify-center gap-6 md:flex">
          {nav.links.map((item) => {
            const sectionId = homeLandingSectionIdFromHref(item.href);
            if (!sectionId) {
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-text-secondary text-sm font-semibold"
                >
                  {item.label}
                </Link>
              );
            }

            const isActive = activeSectionId === sectionId;
            return (
              <HomeHashLink
                key={item.href}
                sectionId={sectionId}
                className={`hidden min-h-11 items-center border-b-2 px-2 text-sm font-semibold motion-safe:transition-colors md:inline-flex ${
                  isActive
                    ? "border-brand-primary text-text-primary"
                    : "text-text-secondary hover:text-text-primary border-transparent"
                }`}
              >
                {item.label}
              </HomeHashLink>
            );
          })}
        </Box>

        <Box className="flex shrink-0 items-center gap-2">
          <Link to={ROUTES.LOGIN}>
            <BodyText
              as="span"
              size="sm"
              className="text-text-primary hidden min-h-11 items-center px-2 font-semibold sm:inline-flex"
            >
              {nav.loginLabel}
            </BodyText>
          </Link>
          <Link to={ROUTES.SIGNUP}>
            <Button
              variant="primary"
              size="sm"
              className={`${LANDING_GOLD_SIGNUP_BUTTON_CLASS} hidden sm:inline-flex`}
            >
              {nav.signUpLabel}
            </Button>
          </Link>
          <Button variant="primary" size="sm" onPress={() => openLandingBookDemo("nav")}>
            {nav.bookDemoLabel}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
