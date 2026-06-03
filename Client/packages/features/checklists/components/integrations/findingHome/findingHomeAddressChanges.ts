/** True when the field has a value and it differs from the last saved transaction address. */
export function hasFindingHomeAddressChanges(
  currentAddress: string,
  saved: { address?: string | null } | null | undefined
): boolean {
  const trimmed = currentAddress.trim();
  if (!trimmed) return false;
  const savedTrimmed = (saved?.address ?? "").trim();
  if (!savedTrimmed) return true;
  return trimmed !== savedTrimmed;
}
