import { getDocument } from "packages/utils/core/platform";

/**
 * Computes which campaign category section should be active from scroll position.
 */
export function computeCampaignActiveSectionId(
  win: Pick<Window, "scrollY" | "innerHeight">,
  doc: Pick<Document, "documentElement" | "getElementById">,
  sectionIds: readonly string[]
): string {
  if (sectionIds.length === 0) {
    return "";
  }

  const scrollPosition = win.scrollY + 200;
  const documentHeight = doc.documentElement.scrollHeight;
  const windowHeight = win.innerHeight;
  const scrollBottom = scrollPosition + windowHeight;

  if (win.scrollY <= 5) {
    return sectionIds[0] ?? "";
  }
  if (scrollBottom >= documentHeight - 100) {
    return sectionIds[sectionIds.length - 1] ?? "";
  }

  for (let i = sectionIds.length - 1; i >= 0; i--) {
    const id = sectionIds[i];
    const element = id ? doc.getElementById(id) : null;
    if (element && element.offsetTop <= scrollPosition) {
      return id ?? "";
    }
  }

  return sectionIds[0] ?? "";
}

export function scrollToCampaignSection(sectionId: string): void {
  const doc = getDocument();
  const element = doc?.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
