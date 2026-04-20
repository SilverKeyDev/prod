/**
 * Resolve which settings section id should be active from scroll position (web).
 */
export function getActiveSettingsSectionId(
  sectionIds: string[],
  scrollY: number,
  documentHeight: number,
  windowHeight: number,
  getElementOffsetTop: (sectionId: string) => number | null
): string | undefined {
  if (sectionIds.length === 0) return undefined;

  const scrollPosition = scrollY + 200;
  const scrollBottom = scrollPosition + windowHeight;

  if (scrollY <= 5) {
    return sectionIds[0];
  }

  if (scrollBottom >= documentHeight - 100) {
    return sectionIds[sectionIds.length - 1];
  }

  for (let i = sectionIds.length - 1; i >= 0; i--) {
    const id = sectionIds[i];
    const top = getElementOffsetTop(id);
    if (top !== null && top <= scrollPosition) {
      return id;
    }
  }

  return sectionIds[0];
}
