import { useEffect, useState } from "react";

import {
  LANDING_SECTION_IDS,
  type LandingSectionId,
} from "packages/features/homeauth/utils/landingSectionIds";
import { getDocument, getWindow } from "packages/utils/core/platform";

const SCROLL_SPY_SECTIONS: LandingSectionId[] = [
  LANDING_SECTION_IDS.info,
  LANDING_SECTION_IDS.savings,
  LANDING_SECTION_IDS.pricing,
  LANDING_SECTION_IDS.faq,
];

/**
 * Returns the landing section id currently in view for nav scroll-spy highlighting.
 */
export function useLandingActiveSection(): LandingSectionId | null {
  const [activeSectionId, setActiveSectionId] = useState<LandingSectionId | null>(null);

  useEffect(() => {
    const doc = getDocument();
    const win = getWindow();
    if (!doc || !win || typeof IntersectionObserver === "undefined") {
      return;
    }

    const visibleSections = new Map<LandingSectionId, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const sectionId = entry.target.id as LandingSectionId;
          if (!SCROLL_SPY_SECTIONS.includes(sectionId)) {
            continue;
          }
          if (entry.isIntersecting) {
            visibleSections.set(sectionId, entry.intersectionRatio);
          } else {
            visibleSections.delete(sectionId);
          }
        }

        let nextActive: LandingSectionId | null = null;
        let bestRatio = 0;
        for (const [sectionId, ratio] of visibleSections) {
          if (ratio >= bestRatio) {
            bestRatio = ratio;
            nextActive = sectionId;
          }
        }

        setActiveSectionId((prev) => {
          if (prev === nextActive) {
            return prev;
          }
          if (
            nextActive &&
            win.location.pathname === "/" &&
            !win.location.hash.includes(nextActive)
          ) {
            win.history.replaceState(null, "", `/#${nextActive}`);
          }
          return nextActive;
        });
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    );

    for (const sectionId of SCROLL_SPY_SECTIONS) {
      const element = doc.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    }

    return () => observer.disconnect();
  }, []);

  return activeSectionId;
}
