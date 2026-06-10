import { HOUSING_TYPE_OPTIONS } from "packages/features/profile";

export function getSearchFilterHomeTypeLabel(value: string): string {
  if (!value) return "Any";
  const values = value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (values.length === 0) return "Any";
  const labels = values.map((v) => HOUSING_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v);
  return labels.join(", ");
}
