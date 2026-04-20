import type { HomeDetailsTranslate } from "./homeDetailsColumnTypes";

export function asTrimmedString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s === "" ? undefined : s;
}

export function asStringList(v: unknown, maxItems: number): string[] {
  if (!Array.isArray(v)) return [];
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") continue;
    const t = item.trim();
    if (t) out.push(t);
    if (out.length >= maxItems) break;
  }
  return out;
}

export function normalizeExteriorFeatures(v: unknown): string[] {
  if (Array.isArray(v)) return asStringList(v, 24);
  const s = asTrimmedString(v);
  return s ? [s] : [];
}

export function formatParkingLines(
  t: HomeDetailsTranslate,
  garageSpaces: number | undefined,
  parking: number | undefined,
  parkingFeatures: string[]
): string[] {
  const lines: string[] = [];
  if (typeof garageSpaces === "number" && garageSpaces > 0) {
    lines.push(
      t("property_details.car_garage", {
        count: garageSpaces,
        defaultValue: "{{count}}-car garage",
      })
    );
  } else if (typeof parking === "number" && parking > 0) {
    lines.push(
      t("property_details.spaces", {
        count: parking,
        defaultValue: "{{count}} spaces",
      })
    );
  }
  lines.push(...parkingFeatures);
  return lines;
}

export function laundryFromFeatures(features: string[]): string[] {
  return features.filter((f) => /laundry|washer|dryer/i.test(f));
}

export function joinUnique(lines: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of lines) {
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
    if (out.length >= max) break;
  }
  return out;
}

export function formatSchoolLines(
  schools: unknown,
  t: HomeDetailsTranslate,
  maxSchools: number
): string[] {
  if (!Array.isArray(schools) || schools.length === 0) return [];
  const sep = t("property_details.bullet_separator", { defaultValue: " • " });
  const mi = t("property_details.mi", { defaultValue: "mi" });
  const lines: string[] = [];
  for (const raw of schools.slice(0, maxSchools)) {
    if (typeof raw !== "object" || raw === null) continue;
    const s = raw as Record<string, unknown>;
    const name = asTrimmedString(s.name);
    if (!name) continue;
    const level = asTrimmedString(s.level);
    const grades = asTrimmedString(s.grades);
    const mid = [level, grades].filter(Boolean).join(sep);
    const distRaw = s.distance;
    const distStr =
      distRaw !== undefined && distRaw !== null && String(distRaw).trim() !== ""
        ? `${String(distRaw)} ${mi}`
        : "";
    const ratingRaw = s.rating;
    const ratingNum =
      typeof ratingRaw === "number"
        ? ratingRaw
        : typeof ratingRaw === "string"
          ? parseFloat(ratingRaw)
          : NaN;
    const ratingStr = Number.isFinite(ratingNum)
      ? t("property_details.section_rating_value", {
          value: String(ratingNum),
          defaultValue: "{{value}}/10",
        })
      : "";
    const parts = [name];
    if (mid) parts.push(mid);
    if (ratingStr) parts.push(ratingStr);
    if (distStr) parts.push(distStr);
    lines.push(parts.join(sep));
  }
  return lines;
}

export function hoaLine(p: Record<string, unknown>, t: HomeDetailsTranslate): string | undefined {
  const monthly = p.monthlyHoaFee;
  if (typeof monthly === "number" && monthly > 0) {
    return t("property_details.hd_hoa_monthly", {
      amount: monthly.toLocaleString(),
      defaultValue: "${{amount}}/mo estimated HOA",
    });
  }
  const assoc = asTrimmedString(p.associationFee) ?? asTrimmedString(p.hoaFee);
  return assoc;
}
