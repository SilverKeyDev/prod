import { LANDING_NAV_SCROLL_MARGIN_CLASS } from "packages/features/homeauth/utils/landingChrome";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { scrollToLandingSection } from "packages/features/homeauth/utils/landingScroll";
import { LANDING_SECTION_IDS } from "packages/features/homeauth/utils/landingSectionIds";
import { HomeHashLink, homeLandingSectionIdFromHref, Link, ROUTES } from "packages/navigation";
import { MINI_LOGO } from "packages/ui/components/media/asset";
import { Box, Image } from "packages/ui/components/structure/primitives";

import { BodyText, Button, Title } from "@/components/ui";

export type LandingNavProps = {
  onBookDemo?: () => void;
};

export function LandingNav({ onBookDemo }: LandingNavProps) {
  const { nav } = LANDING_CONTENT;

  const linkClass =
    "text-text-secondary hover:text-text-primary hidden min-h-11 items-center px-2 text-sm font-semibold motion-safe:transition-colors md:inline-flex";

  const handleBookDemo = () => {
    if (onBookDemo) {
      onBookDemo();
      return;
    }
    scrollToLandingSection(LANDING_SECTION_IDS.finalCta);
  };

  return (
    <header
      className={`safe-top border-border z-header bg-background-base/95 fixed left-0 right-0 top-0 border-b backdrop-blur-md ${LANDING_NAV_SCROLL_MARGIN_CLASS}`}
    >
      <Box className="px-responsive-sm mx-auto flex h-[58px] max-w-[1100px] items-center justify-between gap-3">
        <Link to="/" className="flex shrink-0 touch-manipulation items-center gap-2">
          <Image src={MINI_LOGO} alt={nav.landmarkLabel} className="h-9 w-9 object-contain" />
          <Title as="span" size="sm" className="!text-brand-primary !font-serif font-bold">
            {nav.landmarkLabel}
          </Title>
        </Link>

        <Box className="hidden flex-1 items-center justify-center gap-6 md:flex">
          {nav.links.map((item) => {
            const sectionId = homeLandingSectionIdFromHref(item.href);
            return sectionId ? (
              <HomeHashLink key={item.href} sectionId={sectionId} className={linkClass}>
                {item.label}
              </HomeHashLink>
            ) : (
              <Link key={item.href} to={item.href} className={linkClass}>
                {item.label}
              </Link>
            );
          })}
        </Box>

        <Box className="flex shrink-0 items-center gap-2">
          <Link to={ROUTES.LOGIN}>
            <BodyText
              as="span"
              size="sm"
              className="text-text-primary inline-flex min-h-11 items-center px-3 font-semibold"
            >
              {nav.loginLabel}
            </BodyText>
          </Link>
          <Button variant="primary" size="sm" onPress={handleBookDemo}>
            {nav.bookDemoLabel}
          </Button>
        </Box>
      </Box>
    </header>
  );
}
