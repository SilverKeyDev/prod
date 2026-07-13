import { useEffect } from "react";

import { computeCampaignActiveSectionId } from "packages/features/brokerage/utils/campaigns/campaignScrollActiveSection";
import { getDocument, getWindow } from "packages/utils/core/platform";

/**
 * Keeps campaign sidebar active section in sync with window scroll.
 */
export function useCampaignScrollActiveSection(
  sectionIds: readonly string[],
  setActiveSection: (id: string) => void
): void {
  useEffect(() => {
    const win = getWindow();
    const doc = getDocument();
    if (!win || !doc) return;
    setActiveSection(computeCampaignActiveSectionId(win, doc, sectionIds));
  }, [sectionIds, setActiveSection]);

  useEffect(() => {
    const win = getWindow();
    if (!win) return;

    const handleScroll = () => {
      const doc = getDocument();
      if (!doc) return;
      setActiveSection(computeCampaignActiveSectionId(win, doc, sectionIds));
    };

    win.addEventListener("scroll", handleScroll);
    return () => win.removeEventListener("scroll", handleScroll);
  }, [sectionIds, setActiveSection]);
}
