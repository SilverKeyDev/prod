import { dayjs } from "packages/utils/date";

export type MonthPickerCell = {
  /** YYYY-MM-DD */
  key: string;
  dayOfMonth: number;
  inMonth: boolean;
  date: Date;
};

/** Six-week grid (42 cells) starting Sunday, aligned to `month0` (0–11). */
export function buildMonthPickerGrid(
  year: number,
  month0: number,
): MonthPickerCell[] {
  const ymd = `${year}-${String(month0 + 1).padStart(2, "0")}-01`;
  const first = dayjs(ymd, "YYYY-MM-DD", true).startOf("day");
  if (!first.isValid()) {
    const fallback = dayjs().startOf("month");
    return buildMonthPickerGrid(fallback.year(), fallback.month());
  }
  const startOffset = first.day();
  const gridStart = first.subtract(startOffset, "day");
  const cells: MonthPickerCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = gridStart.add(i, "day");
    cells.push({
      key: d.format("YYYY-MM-DD"),
      dayOfMonth: d.date(),
      inMonth: d.month() === month0,
      date: d.toDate(),
    });
  }
  return cells;
}
