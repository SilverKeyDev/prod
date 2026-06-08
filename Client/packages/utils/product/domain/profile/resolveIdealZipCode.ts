import type { OnboardingData } from "@/features/profile/types/onboarding/onboarding";

const ZIP_PATTERN = /^\d{5}$/;

/** Extract last 5-digit token from an address string (mirrors server aggregation read). */
export function extractZipFromAddress(address: string | undefined | null): string | undefined {
  if (!address || typeof address !== "string") return undefined;
  const parts = address.trim().split(/\s+/);
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const token = parts[i]?.replace(/[,]/g, "") ?? "";
    if (ZIP_PATTERN.test(token)) return token;
    const match = token.match(/\b(\d{5})(?:-\d{4})?\b/);
    if (match?.[1]) return match[1];
  }
  return undefined;
}

/** Prefer explicit ideal_zip_code; else first important location with a zip. */
export function resolveIdealZipCode(
  formData: Pick<OnboardingData, "ideal_zip_code" | "important_locations">
): string | undefined {
  const explicit = formData.ideal_zip_code?.trim();
  if (explicit && ZIP_PATTERN.test(explicit)) return explicit;

  const locations = formData.important_locations ?? [];
  for (const loc of locations) {
    const zip = extractZipFromAddress(loc?.address);
    if (zip) return zip;
  }
  return undefined;
}
