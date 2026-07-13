/**
 * Fixture transaction-activity distributions for Deal Forensics.
 * Week = day×hour heatmap; month = day-of-month bars; year = month-of-year bars.
 */
export type ActivityHeatMapCell = {
  x: number;
  y: number;
  value: number;
};

export type ActivityBarPoint = {
  label: string;
  value: number;
};

export const WEEK_HEATMAP_X_LABELS = [
  "8:00",
  "9:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

export const WEEK_HEATMAP_Y_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Day-of-week × hour density (typical week). */
export const WEEK_HEATMAP_DATA: ActivityHeatMapCell[] = [
  { x: 0, y: 0, value: 6 },
  { x: 1, y: 0, value: 18 },
  { x: 2, y: 0, value: 22 },
  { x: 3, y: 0, value: 14 },
  { x: 4, y: 0, value: 8 },
  { x: 5, y: 0, value: 10 },
  { x: 6, y: 0, value: 16 },
  { x: 7, y: 0, value: 20 },
  { x: 8, y: 0, value: 12 },
  { x: 9, y: 0, value: 7 },
  { x: 10, y: 0, value: 4 },
  { x: 0, y: 1, value: 5 },
  { x: 1, y: 1, value: 20 },
  { x: 2, y: 1, value: 24 },
  { x: 3, y: 1, value: 16 },
  { x: 4, y: 1, value: 9 },
  { x: 5, y: 1, value: 11 },
  { x: 6, y: 1, value: 18 },
  { x: 7, y: 1, value: 22 },
  { x: 8, y: 1, value: 14 },
  { x: 9, y: 1, value: 8 },
  { x: 10, y: 1, value: 3 },
  { x: 0, y: 2, value: 7 },
  { x: 1, y: 2, value: 16 },
  { x: 2, y: 2, value: 20 },
  { x: 3, y: 2, value: 18 },
  { x: 4, y: 2, value: 10 },
  { x: 5, y: 2, value: 12 },
  { x: 6, y: 2, value: 15 },
  { x: 7, y: 2, value: 19 },
  { x: 8, y: 2, value: 11 },
  { x: 9, y: 2, value: 6 },
  { x: 10, y: 2, value: 3 },
  { x: 0, y: 3, value: 4 },
  { x: 1, y: 3, value: 14 },
  { x: 2, y: 3, value: 19 },
  { x: 3, y: 3, value: 21 },
  { x: 4, y: 3, value: 8 },
  { x: 5, y: 3, value: 9 },
  { x: 6, y: 3, value: 17 },
  { x: 7, y: 3, value: 21 },
  { x: 8, y: 3, value: 13 },
  { x: 9, y: 3, value: 7 },
  { x: 10, y: 3, value: 2 },
  { x: 0, y: 4, value: 5 },
  { x: 1, y: 4, value: 12 },
  { x: 2, y: 4, value: 17 },
  { x: 3, y: 4, value: 15 },
  { x: 4, y: 4, value: 7 },
  { x: 5, y: 4, value: 8 },
  { x: 6, y: 4, value: 14 },
  { x: 7, y: 4, value: 18 },
  { x: 8, y: 4, value: 10 },
  { x: 9, y: 4, value: 5 },
  { x: 10, y: 4, value: 2 },
  { x: 0, y: 5, value: 1 },
  { x: 1, y: 5, value: 3 },
  { x: 2, y: 5, value: 4 },
  { x: 3, y: 5, value: 3 },
  { x: 4, y: 5, value: 2 },
  { x: 5, y: 5, value: 2 },
  { x: 6, y: 5, value: 3 },
  { x: 7, y: 5, value: 4 },
  { x: 8, y: 5, value: 2 },
  { x: 9, y: 5, value: 1 },
  { x: 10, y: 5, value: 0 },
  { x: 0, y: 6, value: 1 },
  { x: 1, y: 6, value: 2 },
  { x: 2, y: 6, value: 3 },
  { x: 3, y: 6, value: 2 },
  { x: 4, y: 6, value: 1 },
  { x: 5, y: 6, value: 1 },
  { x: 6, y: 6, value: 2 },
  { x: 7, y: 6, value: 3 },
  { x: 8, y: 6, value: 2 },
  { x: 9, y: 6, value: 1 },
  { x: 10, y: 6, value: 0 },
];

/** Day-of-month transaction counts (31 days). */
export const MONTH_DISTRIBUTION: ActivityBarPoint[] = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  const weekdayBoost = day % 7 === 0 || day % 7 === 6 ? 0.45 : 1;
  const midMonth = 1 + Math.sin((day / 31) * Math.PI) * 0.35;
  const value = Math.round((48 + (day % 5) * 6 + (day % 3) * 4) * weekdayBoost * midMonth);
  return { label: String(day), value };
});

/** Month-of-year transaction counts. */
export const YEAR_DISTRIBUTION: ActivityBarPoint[] = [
  { label: "Jan", value: 1884 },
  { label: "Feb", value: 1755 },
  { label: "Mar", value: 1921 },
  { label: "Apr", value: 1880 },
  { label: "May", value: 1928 },
  { label: "Jun", value: 1898 },
  { label: "Jul", value: 1935 },
  { label: "Aug", value: 1873 },
  { label: "Sep", value: 1890 },
  { label: "Oct", value: 1913 },
  { label: "Nov", value: 1845 },
  { label: "Dec", value: 1854 },
];
