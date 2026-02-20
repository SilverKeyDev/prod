/**
 * Compute number of carousel columns from container width and options.
 */
export function computeCarouselCols(opts: {
  containerWidth: number;
  centerMode: boolean;
  cardMinWidth: number;
  cardGap: number;
  minCols: number;
  maxCols: number;
}): number {
  const {
    containerWidth: w,
    centerMode,
    cardMinWidth,
    cardGap,
    minCols,
    maxCols,
  } = opts;
  if (centerMode) return 1;
  const minW = Math.max(1, Math.floor(cardMinWidth));
  const gap = Math.max(0, Math.floor(cardGap));
  if (w === 0) return Math.max(1, minCols);
  let cols = Math.floor((w + gap) / (minW + gap));
  cols = Math.max(minCols, Math.min(cols, maxCols));
  const fits = (c: number) => c * minW + (c - 1) * gap <= w;
  while (cols > minCols && !fits(cols)) cols--;
  while (cols < maxCols && fits(cols + 1)) cols++;
  return Math.max(1, cols);
}
