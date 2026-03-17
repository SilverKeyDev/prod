export const MAX_VISIBLE = 3;
export const ADDRESS_MAX_LENGTH = 80;
export const LOCATION_SAVE_DEBOUNCE_MS = 400;

export function truncateAddress(address: string): string {
  if (address.length <= ADDRESS_MAX_LENGTH) return address;
  return `${address.slice(0, ADDRESS_MAX_LENGTH - 3)}...`;
}
