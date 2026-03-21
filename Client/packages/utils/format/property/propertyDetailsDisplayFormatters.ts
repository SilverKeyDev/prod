import type { SearchResult } from "packages/types";

import { formatPropertyType } from "./propertyTypeFormatters";

export { formatPropertyType };

export type AddressObject = {
  streetAddress?: string;
  city?: string;
  state?: string;
  zipcode?: string;
};

type PropertyImages = {
  images?: string[];
};

type PhotoSource =
  | string
  | {
      url?: string;
      mixedSources?: {
        jpeg?: Array<{ url?: string }>;
      };
    };

type PropertyWithPhotos = {
  photos?: PhotoSource[];
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

export function formatPrice(price: string | number | undefined): string {
  if (price === null || price === undefined || price === "")
    return "Price not available";
  const numPrice =
    typeof price === "string"
      ? parseFloat(price.replace(/[^0-9.-]+/g, ""))
      : price;
  if (isNaN(numPrice)) return "Price not available";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice);
}

export function getPropertyImages(property: unknown): string[] {
  const propertyWithImages = property as PropertyImages | SearchResult;

  if (
    propertyWithImages &&
    typeof propertyWithImages === "object" &&
    Array.isArray(propertyWithImages.images)
  ) {
    return propertyWithImages.images;
  }

  const propertyWithPhotos = property as PropertyWithPhotos;
  if (propertyWithPhotos && Array.isArray(propertyWithPhotos.photos)) {
    return propertyWithPhotos.photos
      .map((p) => {
        if (typeof p === "string") return p;
        if (p && typeof p === "object" && "url" in p) {
          return p.url;
        }
        if (p && typeof p === "object" && "mixedSources" in p) {
          const { mixedSources } = p;
          if (
            mixedSources &&
            typeof mixedSources === "object" &&
            "jpeg" in mixedSources
          ) {
            const { jpeg } = mixedSources;
            if (Array.isArray(jpeg) && jpeg.length > 0) {
              const lastJpeg = jpeg[jpeg.length - 1];
              if (
                lastJpeg &&
                typeof lastJpeg === "object" &&
                "url" in lastJpeg
              ) {
                return lastJpeg.url;
              }
            }
          }
        }
        return null;
      })
      .filter((url): url is string => url !== null);
  }

  return [
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
  ];
}
