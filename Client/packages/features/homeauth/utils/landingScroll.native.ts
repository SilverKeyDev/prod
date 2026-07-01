type LandingScrollTarget = {
  scrollTo: (options: { y?: number; animated?: boolean }) => void;
  scrollToEnd?: (options?: { animated?: boolean }) => void;
} | null;

let landingScrollTarget: LandingScrollTarget = null;

export function registerLandingScrollTarget(target: LandingScrollTarget): void {
  landingScrollTarget = target;
}

export function scrollToLandingSection(sectionId: string): void {
  if (sectionId === "final-cta") {
    landingScrollTarget?.scrollToEnd?.({ animated: true });
    return;
  }
  landingScrollTarget?.scrollTo?.({ y: 0, animated: true });
}
