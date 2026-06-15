import { useEffect } from "react";

import { computePersonalizationActiveSectionId } from "packages/features/profile/utils/personalization/personalizationScrollActiveSection";
import { getDocument, getWindow } from "packages/utils/core/platform";

/**
 * Keeps active section in sync with scroll position for long personalization pages.
 * Pass a memoized `sectionIds` array (e.g. from `STEPS.map((s) => s.id)`).
 */
export function usePersonalizationScrollActiveSection(
  sectionIds: readonly string[],
  setActiveSection: (id: string) => void
): void {
  useEffect(() => {
    const win = getWindow();
    const doc = getDocument();
    if (!win || !doc) return;
    setActiveSection(computePersonalizationActiveSectionId(win, doc, sectionIds));
  }, [sectionIds, setActiveSection]);

  useEffect(() => {
    const win = getWindow();
    if (!win) return;

    const handleScroll = () => {
      const doc = getDocument();
      if (!doc) return;
      setActiveSection(computePersonalizationActiveSectionId(win, doc, sectionIds));
    };

    win.addEventListener("scroll", handleScroll);
    return () => win.removeEventListener("scroll", handleScroll);
  }, [sectionIds, setActiveSection]);
}
