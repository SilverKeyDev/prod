import type { AgentTestimonial } from "packages/features/profile/types/onboarding/onboarding";
import { parseUserPreferencesArray } from "packages/features/profile/utils/onboarding/validation/preferencesUtils";

export function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

export function toString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  return undefined;
}

export function toBool(value: unknown): boolean | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === 1) return true;
  if (value === "false" || value === 0) return false;
  return undefined;
}

export function toStringArray(value: unknown): string[] {
  const arr = parseUserPreferencesArray(value);
  return arr.filter((v): v is string => typeof v === "string");
}

export function toImportantLocations(
  value: unknown,
): { address: string; commute_tolerance?: number }[] {
  const arr = parseUserPreferencesArray(value);
  return arr
    .filter(
      (v): v is Record<string, unknown> =>
        typeof v === "object" && v !== null && "address" in v,
    )
    .map((v) => {
      const address =
        typeof v.address === "string" ? v.address : String(v.address ?? "");
      const commuteTolerance =
        typeof v.commute_tolerance === "number" &&
        !Number.isNaN(v.commute_tolerance)
          ? v.commute_tolerance
          : typeof v.max_commute_minutes === "number" &&
              !Number.isNaN(v.max_commute_minutes)
            ? v.max_commute_minutes
            : undefined;
      return { address, commute_tolerance: commuteTolerance };
    })
    .filter((loc) => loc.address.trim() !== "");
}

export function toDictArray(value: unknown): Record<string, unknown>[] {
  const arr = parseUserPreferencesArray(value);
  return arr.filter(
    (v): v is Record<string, unknown> =>
      typeof v === "object" && v !== null && !Array.isArray(v),
  );
}

/** Coerce API testimonials into well-formed items (author_name + quote required). */
export function toTestimonialArray(value: unknown): AgentTestimonial[] {
  return toDictArray(value)
    .filter(
      (v) => typeof v.author_name === "string" && typeof v.quote === "string",
    )
    .map((v) => {
      const item: AgentTestimonial = {
        author_name: String(v.author_name),
        quote: String(v.quote),
      };
      if (typeof v.date === "string" && v.date.trim()) item.date = v.date;
      if (typeof v.rating === "number" && v.rating >= 1 && v.rating <= 5) {
        item.rating = Math.round(v.rating);
      }
      if (typeof v.source === "string" && v.source.trim())
        item.source = v.source;
      return item;
    })
    .filter(
      (item) => item.author_name.trim() !== "" && item.quote.trim() !== "",
    );
}

export function toRecordString(
  value: unknown,
): Record<string, string> | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof k === "string" && typeof v === "string") out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
