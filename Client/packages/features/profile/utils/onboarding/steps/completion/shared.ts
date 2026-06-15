import type { ProfileSectionCompletionStatus } from "packages/features/profile/types/sections/profileSections";

export function preferenceExtensionSectionHasAny(section: unknown): boolean {
  if (section == null || typeof section !== "object" || Array.isArray(section)) return false;
  return Object.values(section as Record<string, unknown>).some((v) => {
    if (v == null) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (typeof v === "number") return true;
    if (typeof v === "boolean") return v === true;
    if (Array.isArray(v)) return v.length > 0;
    return false;
  });
}

export function statusFor(hasAny: boolean, isComplete: boolean): ProfileSectionCompletionStatus {
  if (!hasAny) return "empty";
  if (isComplete) return "complete";
  return "needs_attention";
}

export function mergedComplete(parts: ReadonlyArray<{ any: boolean; complete: boolean }>): {
  any: boolean;
  complete: boolean;
} {
  const hasAny = parts.some((p) => p.any);
  const complete =
    hasAny &&
    parts.every((p) => {
      if (!p.any) return true;
      return p.complete;
    });
  return { any: hasAny, complete };
}

export function nonEmptyStr(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

export function tagArrayAny(v: unknown): boolean {
  return Array.isArray(v) && v.some((x) => typeof x === "string" && x.trim().length > 0);
}
