export function formatSavedHomePrice(value: string | number | null | undefined): string {
  if (value == null) return "Price N/A";
  const asNumber =
    typeof value === "string"
      ? Number(value.replace(/[^0-9.-]/g, ""))
      : typeof value === "number"
        ? value
        : Number.NaN;
  if (!Number.isFinite(asNumber)) return String(value);
  return `$${asNumber.toLocaleString()}`;
}
