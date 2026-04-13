import { useEffect, useState } from "react";

import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import {
  HomeHashLink,
  homeLandingSectionIdFromHref,
  Link,
  ROUTES,
} from "packages/navigation";
import { LOGO } from "packages/ui/components/asset";
import { Box, Image } from "packages/ui/components/primitives";
import { getWindow } from "packages/utils/platform";

import { Button } from "@/components/ui";

const SCROLL_SOLID_THRESHOLD_PX = 12;

export type LandingNavProps = {
  onSignUp: () => void;
};

export function LandingNav({ onSignUp }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const { nav } = LANDING_CONTENT;

  useEffect(() => {
    const win = getWindow();
    if (!win) {
      return;
    }
    const onScroll = () => {
      setScrolled(win.scrollY > SCROLL_SOLID_THRESHOLD_PX);
    };
    onScroll();
    win.addEventListener("scroll", onScroll, { passive: true });
    return () => win.removeEventListener("scroll", onScroll);
  }, []);

  const linkColor = scrolled
    ? "text-text-primary hover:text-text-primary/80"
    : "max-lg:text-white max-lg:hover:text-white/90 lg:text-text-primary lg:hover:text-text-primary/80";

  const sectionLinkClass = `inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg px-2 py-2 text-sm font-medium motion-safe:transition-colors sm:min-h-11 sm:min-w-0 sm:px-3 sm:py-2 ${linkColor} touch-manipulation max-lg:active:bg-white/15 max-lg:hover:bg-white/10 lg:hover:opacity-90`;

  return (
    <header
      className={`safe-top border-border z-header px-responsive-sm fixed left-0 right-0 top-0 flex w-full min-w-0 flex-col gap-0 border-b motion-safe:transition-colors motion-safe:duration-200 ${
        scrolled
          ? "bg-background-surface/95 shadow-sm backdrop-blur-sm"
          : "bg-transparent"
      }`}
    >
      <Box className="flex min-h-16 w-full min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-2">
        <Link to="/" className="flex shrink-0 touch-manipulation items-center">
          <Image src={LOGO} alt={nav.landmarkLabel} className="h-8 w-auto" />
        </Link>
        <Box className="order-last flex w-full min-w-0 items-center justify-center gap-1 sm:gap-2 md:order-none md:w-auto md:flex-1 md:justify-center">
          {nav.links.map((item) => {
            const sectionId = homeLandingSectionIdFromHref(item.href);
            return sectionId ? (
              <HomeHashLink
                key={item.href}
                sectionId={sectionId}
                className={sectionLinkClass}
              >
                {item.label}
              </HomeHashLink>
            ) : (
              <Link key={item.href} to={item.href} className={sectionLinkClass}>
                {item.label}
              </Link>
            );
          })}
        </Box>
        <Box className="flex shrink-0 items-center gap-1">
          <Link
            to={ROUTES.LOGIN}
            className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium motion-safe:transition-colors sm:min-h-11 sm:min-w-0 sm:py-2 ${linkColor} touch-manipulation max-lg:hover:bg-white/10 max-lg:active:bg-white/15 lg:hover:opacity-90`}
          >
            {nav.loginLabel}
          </Link>
          <Button
            variant="primary"
            size="sm"
            onPress={onSignUp}
            className="shrink-0 text-sm font-medium"
          >
            {nav.signUpLabel}
          </Button>
        </Box>
      </Box>
    </header>
  );
}
