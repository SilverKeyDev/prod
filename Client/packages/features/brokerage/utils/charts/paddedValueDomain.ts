/**
 * Compute a tight value-axis domain: slightly below the data min, up to the data max.
 * Avoids ECharts forcing a 0 baseline when the series sits in a narrow high band.
 * Min is floored and clamped at 0; max is ceiled.
 */

const PAD_RATIO = 0.1;
const FLAT_SERIES_PAD_RATIO = 0.05;
const FLAT_SERIES_MIN_PAD = 1;
const EMPTY_DOMAIN = { min: 0, max: 1 } as const;

export type ValueDomain = {
  min: number;
  max: number;
};

export function paddedValueDomain(values: readonly number[]): ValueDomain {
  if (values.length === 0) {
    return { ...EMPTY_DOMAIN };
  }

  let dataMin = values[0]!;
  let dataMax = values[0]!;
  for (let i = 1; i < values.length; i++) {
    const v = values[i]!;
    if (v < dataMin) dataMin = v;
    if (v > dataMax) dataMax = v;
  }

  const span = dataMax - dataMin;
  const pad =
    span === 0
      ? Math.max(Math.abs(dataMax) * FLAT_SERIES_PAD_RATIO, FLAT_SERIES_MIN_PAD)
      : span * PAD_RATIO;

  const min = Math.max(0, Math.floor(dataMin - pad));
  let max = Math.ceil(dataMax);
  if (max <= min) {
    max = min + 1;
  }

  return { min, max };
}
