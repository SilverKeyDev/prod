import { type ReactNode, useState } from "react";

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

import { BodyText, Button, IconButton, Title } from "@/components/ui";

import { LandingNavMobileMenu } from "./LandingNavMobileMenu.web";

export type LandingNavProps = {
  /**
   * Replaces the Login / Sign up / Book demo cluster (e.g. public agent pages).
   * `null` renders no end actions; omit for the default landing cluster.
   */
  endActions?: ReactNode;
  /**
   * "publicAgent" (agent public pages): no landing section links; desktop auth
   * cluster matches landing, while on mobile Log in stays in the bar and the
   * hamburger holds Sign up + Book a demo.
   */
  variant?: "landing" | "publicAgent";
};

export function LandingNav({ endActions, variant = "landing" }: LandingNavProps = {}) {
  const { nav } = LANDING_CONTENT;
  const activeSectionId = useLandingActiveSection();
  const [menuOpen, setMenuOpen] = useState(false);
  const showDefaultActions = endActions === undefined;
  const showSectionLinks = variant === "landing";
  // No section links and no default actions (e.g. Back to dashboard) → empty menu.
  const showMenuButton = showSectionLinks || showDefaultActions;

  return (
    <>
      <header
        className={`safe-top border-border z-header bg-background-base/95 fixed left-0 right-0 top-0 border-b backdrop-blur-md ${LANDING_NAV_SCROLL_MARGIN_CLASS}`}
      >
        <Box className="px-responsive-sm mx-auto flex h-[58px] max-w-[1100px] items-center justify-between gap-2 sm:gap-3">
          <Link to="/" className="flex min-w-0 shrink touch-manipulation items-center gap-2">
            <Image
              src={MINI_LOGO}
              alt={nav.landmarkLabel}
              className="h-9 w-9 shrink-0 object-contain"
            />
            <Title
              as="span"
              size="sm"
              className="!text-brand-primary truncate !font-serif font-bold"
            >
              {nav.landmarkLabel}
            </Title>
          </Link>

          {showSectionLinks ? (
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
          ) : null}

          <Box className="flex shrink-0 items-center gap-1 sm:gap-2">
            {showMenuButton ? (
              <IconButton
                variant="ghost"
                size="md"
                iconName="menu"
                label="Open navigation menu"
                onPress={() => setMenuOpen(true)}
                className="touch-manipulation md:hidden"
              />
            ) : null}
            {showDefaultActions ? (
              <>
                <Link to={ROUTES.LOGIN}>
                  <BodyText
                    as="span"
                    size="sm"
                    className={`text-text-primary min-h-11 items-center px-2 font-semibold ${
                      variant === "publicAgent" ? "inline-flex" : "hidden sm:inline-flex"
                    }`}
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
                <Button
                  variant="primary"
                  size="sm"
                  className={variant === "publicAgent" ? "hidden sm:inline-flex" : ""}
                  onPress={() => openLandingBookDemo("nav")}
                >
                  {nav.bookDemoLabel}
                </Button>
              </>
            ) : (
              endActions
            )}
          </Box>
        </Box>
      </header>

      {showMenuButton ? (
        <LandingNavMobileMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          activeSectionId={activeSectionId}
          showDefaultActions={showDefaultActions}
          variant={variant}
        />
      ) : null}
    </>
  );
}
