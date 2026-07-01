import { getDocument } from "packages/utils/core/platform";

export function scrollToLandingSection(sectionId: string): void {
  getDocument()?.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
