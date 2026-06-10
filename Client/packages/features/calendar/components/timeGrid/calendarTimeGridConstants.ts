/** Percent width of the time-label gutter (left of day columns). */
export const CAL_TIME_GRID_GUTTER_WIDTH_PCT = 10;

/** Shared grid columns: gutter + equal day tracks (keeps week header and hour grid aligned). */
export function calTimeGridTemplateColumns(dayCount: number): string {
  return `${CAL_TIME_GRID_GUTTER_WIDTH_PCT}% repeat(${dayCount}, minmax(0, 1fr))`;
}

export const CAL_TIME_GRID_HOURS = 24;

/**
 * Default week scrollport shows 8am–6pm (typical working hours). The full 24h grid stays
 * scrollable for early/late events; opening at midnight or 1am wasted vertical space and
 * hid the hours agents actually schedule in.
 */
export const CAL_TIME_GRID_DEFAULT_VISIBLE_START_HOUR = 8;
/** Exclusive end hour for the default scrollport (18 = 6pm). */
export const CAL_TIME_GRID_DEFAULT_VISIBLE_END_HOUR = 18;
export const CAL_TIME_GRID_DEFAULT_VISIBLE_HOUR_SPAN =
  CAL_TIME_GRID_DEFAULT_VISIBLE_END_HOUR - CAL_TIME_GRID_DEFAULT_VISIBLE_START_HOUR;
export const CAL_TIME_GRID_ALL_DAY_ROW_HEIGHT = 22;
export const CAL_TIME_GRID_ALL_DAY_MAX_VISIBLE = 4;
export const CAL_TIME_GRID_EVENT_MIN_HEIGHT_FOR_TIME = 24;

/** Pixels: hour labels sit this far above the solid hour gridline. */
export const CAL_TIME_GRID_HOUR_LABEL_OFFSET_ABOVE_LINE = 14;
