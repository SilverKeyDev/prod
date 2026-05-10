/** Percent width of the time-label gutter (left of day columns). */
export const CAL_TIME_GRID_GUTTER_WIDTH_PCT = 10;

/** Shared grid columns: gutter + equal day tracks (keeps week header and hour grid aligned). */
export function calTimeGridTemplateColumns(dayCount: number): string {
  return `${CAL_TIME_GRID_GUTTER_WIDTH_PCT}% repeat(${dayCount}, minmax(0, 1fr))`;
}

export const CAL_TIME_GRID_HOURS = 24;
export const CAL_TIME_GRID_ALL_DAY_ROW_HEIGHT = 22;
export const CAL_TIME_GRID_ALL_DAY_MAX_VISIBLE = 4;
export const CAL_TIME_GRID_EVENT_MIN_HEIGHT_FOR_TIME = 24;

/** Pixels: hour labels sit this far above the solid hour gridline. */
export const CAL_TIME_GRID_HOUR_LABEL_OFFSET_ABOVE_LINE = 14;
