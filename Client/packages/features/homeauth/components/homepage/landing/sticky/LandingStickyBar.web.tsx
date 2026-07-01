import { useEffect, useState } from "react";

import { LANDING_CONTENT } from "packages/features/homeauth/utils/landingContent";
import { scrollToLandingSection } from "packages/features/homeauth/utils/landingScroll";
import { LANDING_SECTION_IDS } from "packages/features/homeauth/utils/landingSectionIds";
import { trackLandingCta } from "packages/hooks/analytics/trackLandingAnalytics";
import { Box } from "packages/ui/components/structure/primitives";
import { getWindow } from "packages/utils/core/platform";

import { BodyText, Button } from "@/components/ui";

export function LandingStickyBar() {
  const { sticky } = LANDING_CONTENT;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const win = getWindow();
    if (!win) {
      return;
    }

    const onScroll = () => {
      const hero = win.document.getElementById(LANDING_SECTION_IDS.hero);
      const threshold = hero ? hero.offsetHeight * 0.5 : 400;
      setVisible(win.scrollY > threshold);
    };

    onScroll();
    win.addEventListener("scroll", onScroll, { passive: true });
    return () => win.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Box
      className={`border-border bg-background-surface/95 safe-bottom fixed bottom-0 left-0 right-0 z-[150] flex items-center justify-between gap-4 border-t px-6 py-2.5 backdrop-blur-md motion-safe:transition-transform motion-safe:duration-300 sm:px-10 ${
        visible ? "translate-y-0" : "translate-y-full motion-reduce:translate-y-0"
      }`}
    >
      <BodyText
        as="p"
        size="sm"
        className="!text-text-secondary hidden !font-serif italic md:block"
      >
        {sticky.message}
      </BodyText>
      <Box className="ml-auto flex gap-2.5">
        <Button
          variant="outline"
          size="sm"
          className="border-gold !text-gold hover:!bg-gold hover:!text-background-base"
          onPress={() => {
            trackLandingCta("sticky-bar");
            scrollToLandingSection(LANDING_SECTION_IDS.finalCta);
          }}
        >
          {sticky.bookDemoLabel}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => {
            getWindow()?.open(sticky.textUsHref, "_self");
          }}
        >
          {sticky.textUsLabel}
        </Button>
      </Box>
    </Box>
  );
}
