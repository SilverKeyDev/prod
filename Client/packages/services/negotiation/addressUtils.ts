/**
 * Extract address from a home object (various shapes).
 */

import { hasProperty, isObject } from "packages/utils";

/**
 * Get address string from a home-like object (address, full_address, or location).
 */
export function getAddressFromHome(home: unknown): string | undefined {
  if (!home) return undefined;
  if (isObject(home)) {
    const withAddress = home as { address?: string };
    if (typeof withAddress.address === "string") return withAddress.address;
    if (
      hasProperty(home, "full_address") &&
      typeof (home as Record<string, unknown>).full_address === "string"
    ) {
      return (home as Record<string, unknown>).full_address as string;
    }
    if (
      hasProperty(home, "location") &&
      typeof (home as Record<string, unknown>).location === "string"
    ) {
      return (home as Record<string, unknown>).location as string;
    }
  }
  if (typeof home === "string") return home;
  return JSON.stringify(home);
}
