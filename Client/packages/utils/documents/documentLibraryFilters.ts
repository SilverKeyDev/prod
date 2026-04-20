/**
 * Document library list helpers. Aligns with Saved → Documents vs Saved → Agreements.
 */

/**
 * Same subset as the Saved page "Documents" tab: excludes DocuSign agreements
 * (`library_kind === "agreement"`). Use for share-in-messaging pickers and anywhere
 * non-agreement files should appear alone.
 */
export function filterDocumentLibraryExcludingAgreements<
  T extends { library_kind?: string | null },
>(items: readonly T[]): T[] {
  return items.filter((d) => d.library_kind !== "agreement");
}
