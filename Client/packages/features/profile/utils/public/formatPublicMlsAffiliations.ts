export type MlsAffiliationDisplayRow = { label: string; value: string };

function humanizeKey(key: string): string {
  const spaced = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");
  return spaced
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => formatValue(item))
      .filter((s) => s.length > 0)
      .join(", ");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/** Turns one MLS affiliation object into sorted label/value rows for display. */
export function formatMlsAffiliationRecord(
  row: Record<string, unknown>
): MlsAffiliationDisplayRow[] {
  const out: MlsAffiliationDisplayRow[] = [];
  for (const [rawKey, rawVal] of Object.entries(row)) {
    const value = formatValue(rawVal);
    if (!value) continue;
    out.push({ label: humanizeKey(rawKey), value });
  }
  out.sort((a, b) => a.label.localeCompare(b.label));
  return out;
}
