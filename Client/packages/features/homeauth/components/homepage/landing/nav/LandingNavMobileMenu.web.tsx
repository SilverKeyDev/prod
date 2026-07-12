import { openLandingBookDemo } from "packages/features/homeauth/utils/landingBookDemo";
import { LANDING_GOLD_SIGNUP_BUTTON_CLASS } from "packages/features/homeauth/utils/landingChrome";
import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { scrollToLandingSection } from "packages/features/homeauth/utils/landingScroll";
import type { LandingSectionId } from "packages/features/homeauth/utils/landingSectionIds";
import { homeLandingSectionIdFromHref, Link, ROUTES } from "packages/navigation";
import { Box } from "packages/ui/components/structure/primitives";
import { Transition } from "packages/ui/components/system/adapters/headless";

import { AccessibleDialog, BodyText, Button, CloseButton, Title } from "@/components/ui";

type LandingNavMobileMenuProps = {
  open: boolean;
  onClose: () => void;
  activeSectionId: LandingSectionId | null;
  /** Hide the auth-actions footer when the nav's end actions are overridden. */
  showDefaultActions?: boolean;
  /**
   * "publicAgent" drops the landing section links and the Login footer item
   * (Login is always visible in the agent-page nav bar).
   */
  variant?: "landing" | "publicAgent";
};

export function LandingNavMobileMenu({
  open,
  onClose,
  activeSectionId,
  showDefaultActions = true,
  variant = "landing",
}: LandingNavMobileMenuProps) {
  const { nav } = LANDING_CONTENT;

  const handleSectionPress = (sectionId: LandingSectionId) => {
    scrollToLandingSection(sectionId);
    onClose();
  };

  const handleBookDemoPress = () => {
    openLandingBookDemo("nav");
    onClose();
  };

  return (
    <Transition show={open} as="div">
      <AccessibleDialog
        onClose={onClose}
        className="z-modal relative md:hidden"
        label={nav.landmarkLabel}
      >
        <Transition.Child
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Box className="bg-overlay-backdrop fixed inset-0" aria-hidden onClick={onClose} />
        </Transition.Child>
        <Box className="pointer-events-none fixed inset-0 flex items-end justify-center p-0 md:hidden">
          <Transition.Child
            enter="ease-out duration-200"
            enterFrom="translate-y-full"
            enterTo="translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="translate-y-0"
            leaveTo="translate-y-full"
          >
            <AccessibleDialog.Panel
              className="bg-background-surface safe-bottom pointer-events-auto flex w-full max-w-6xl flex-col rounded-t-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Box className="border-border flex shrink-0 flex-col items-center border-b pt-2">
                <Box className="bg-border mb-2 h-1 w-10 rounded-full" aria-hidden />
                <Box className="flex w-full items-center justify-between gap-2 px-4 pb-3">
                  <Box className="w-9 shrink-0" aria-hidden />
                  <Title size="sm" as="h2" className="flex-1 text-center">
                    {nav.landmarkLabel}
                  </Title>
                  <Box className="flex w-9 shrink-0 justify-end">
                    <CloseButton onClick={onClose} size="sm" label="Close navigation menu" />
                  </Box>
                </Box>
              </Box>

              {variant === "landing" ? (
                <Box className="flex flex-col gap-1 px-4 py-4">
                  {nav.links.map((item) => {
                    const sectionId = homeLandingSectionIdFromHref(item.href);
                    if (!sectionId) {
                      return (
                        <Link key={item.href} to={item.href} onClick={onClose}>
                          <BodyText
                            as="span"
                            size="sm"
                            className="flex min-h-11 items-center font-semibold"
                          >
                            {item.label}
                          </BodyText>
                        </Link>
                      );
                    }

                    const isActive = activeSectionId === sectionId;
                    return (
                      <Button
                        key={item.href}
                        variant="ghost"
                        size="md"
                        label={item.label}
                        onPress={() => handleSectionPress(sectionId)}
                        className={`!h-auto min-h-11 w-full !justify-start px-2 text-left font-semibold ${
                          isActive ? "!text-brand-primary" : ""
                        }`}
                      >
                        {item.label}
                      </Button>
                    );
                  })}
                </Box>
              ) : null}

              {showDefaultActions ? (
                <Box className="border-border safe-bottom flex flex-col gap-3 border-t px-4 py-4">
                  {variant === "landing" ? (
                    <Link to={ROUTES.LOGIN} onClick={onClose}>
                      <BodyText
                        as="span"
                        size="sm"
                        className="text-text-primary flex min-h-11 items-center justify-center font-semibold"
                      >
                        {nav.loginLabel}
                      </BodyText>
                    </Link>
                  ) : null}
                  <Link to={ROUTES.SIGNUP} onClick={onClose}>
                    <Button
                      variant="primary"
                      size="md"
                      className={`${LANDING_GOLD_SIGNUP_BUTTON_CLASS} w-full`}
                    >
                      {nav.signUpLabel}
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    onPress={handleBookDemoPress}
                  >
                    {nav.bookDemoLabel}
                  </Button>
                </Box>
              ) : null}
            </AccessibleDialog.Panel>
          </Transition.Child>
        </Box>
      </AccessibleDialog>
    </Transition>
  );
}
