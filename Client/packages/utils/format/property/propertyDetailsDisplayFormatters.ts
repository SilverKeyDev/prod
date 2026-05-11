import { formatPrice } from "packages/utils/format/property";
import { getPropertyImages } from "packages/utils/propertyDetails/media/getPropertyImages";

import { formatPropertyType } from "./propertyTypeFormatters";

export { formatPrice, formatPropertyType, getPropertyImages };

export type AddressObject = {
  streetAddress?: string;
  city?: string;
  state?: string;
  zipcode?: string;
};

export function formatAddress(address: unknown): string {
  if (!address) return "";
  if (typeof address === "string") return address;
  if (typeof address === "object" && address !== null) {
    const addr = address as AddressObject;
    const parts: string[] = [];
    if (addr.streetAddress) parts.push(addr.streetAddress);
    if (addr.city) parts.push(addr.city);
    if (addr.state) parts.push(addr.state);
    if (addr.zipcode) parts.push(addr.zipcode);
    return parts.join(", ");
  }
  if (typeof address === "number") return String(address);
  if (typeof address === "boolean") return String(address);
  return "[Unknown]";
}
