export const CONTACT_SHEET_SIZE = 4;
/** First section: 1 hero + 2×2 grid (5 images). Later sections: two 2×2 grids (8 images). */
export const FIRST_PAGE_IMAGE_COUNT = 1 + CONTACT_SHEET_SIZE;
export const OTHER_PAGE_IMAGE_COUNT = 8;
export const GRID_GAP_CLASS = "gap-0.5";

export function getTotalPagesCount(totalImages: number): number {
  if (totalImages <= 0) return 0;
  if (totalImages <= FIRST_PAGE_IMAGE_COUNT) return 1;
  return (
    1 +
    Math.ceil((totalImages - FIRST_PAGE_IMAGE_COUNT) / OTHER_PAGE_IMAGE_COUNT)
  );
}

export function getPageStartForPage(page: number): number {
  if (page === 0) return 0;
  return FIRST_PAGE_IMAGE_COUNT + (page - 1) * OTHER_PAGE_IMAGE_COUNT;
}

export function getPageForIndex(index: number): number {
  if (index < FIRST_PAGE_IMAGE_COUNT) return 0;
  return (
    1 + Math.floor((index - FIRST_PAGE_IMAGE_COUNT) / OTHER_PAGE_IMAGE_COUNT)
  );
}
