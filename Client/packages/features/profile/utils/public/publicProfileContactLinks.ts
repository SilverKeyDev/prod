/** Returns tel: href or null if the number cannot be normalized. */
export function buildTelHref(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/[^\d+]/g, "");
  if (!normalized.replace(/\+/g, "").length) return null;
  return `tel:${normalized}`;
}
