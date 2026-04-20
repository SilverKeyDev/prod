import { dayjs } from "packages/utils/date";

export function orderedRange(a: string, b: string): { lo: string; hi: string } {
  const da = dayjs(a, "YYYY-MM-DD", true);
  const db = dayjs(b, "YYYY-MM-DD", true);
  if (!da.isValid() || !db.isValid()) {
    return { lo: a, hi: b };
  }
  return da.isAfter(db) ? { lo: b, hi: a } : { lo: a, hi: b };
}

export function isInInclusiveRange(key: string, lo: string, hi: string): boolean {
  return key >= lo && key <= hi;
}

export function formatRangeButtonLabel(start: string, end: string): string {
  if (!start) {
    return "Select date or range";
  }
  const s = dayjs(start, "YYYY-MM-DD", true);
  if (!s.isValid()) {
    return "Select date or range";
  }
  if (!end || end === start) {
    return s.format("ddd, MMM D, YYYY");
  }
  const e = dayjs(end, "YYYY-MM-DD", true);
  if (!e.isValid()) {
    return s.format("ddd, MMM D, YYYY");
  }
  const { lo, hi } = orderedRange(start, end);
  const loD = dayjs(lo, "YYYY-MM-DD", true);
  const hiD = dayjs(hi, "YYYY-MM-DD", true);
  if (loD.year() === hiD.year()) {
    return `${loD.format("MMM D")} – ${hiD.format("MMM D, YYYY")}`;
  }
  return `${loD.format("MMM D, YYYY")} – ${hiD.format("MMM D, YYYY")}`;
}
