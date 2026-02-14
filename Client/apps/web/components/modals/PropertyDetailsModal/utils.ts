import type { Property } from "../../../../../packages/hooks/data/search/usePropertyDetails";
import type { SearchResult } from "../../../../../packages/schemas/search";
import { formatPropertyType as formatPropertyTypeUtil } from "../../../../../packages/utils/search/property";

// Local minimal type definitions to avoid dependency on non-existent schema file
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

export const formatAddress = (
  address: string | AddressObject | null | undefined,
): string => {
  if (!address) return "";
  if (typeof address === "string") return address;
  if (typeof address === "object" && address !== null) {
    const addr = address;
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
};

export const formatPrice = (price: string | number | undefined): string => {
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
};

// Re-export the utility function from packages/utils for backward compatibility
export const formatPropertyType = formatPropertyTypeUtil;

export const getPropertyImages = (
  property: Property | SearchResult,
): string[] => {
  const propertyWithImages = property as PropertyImages;

  if (propertyWithImages.images && Array.isArray(propertyWithImages.images)) {
    return propertyWithImages.images;
  }

  const propertyWithPhotos = property as PropertyWithPhotos;
  if (propertyWithPhotos.photos && Array.isArray(propertyWithPhotos.photos)) {
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
};
