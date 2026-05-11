import type { FeedListing } from "packages/features/feed/types/feed";
import type { SearchResult } from "packages/features/search/types/domain/result";
import { DEFAULT_PLACEHOLDER_IMAGE } from "packages/utils/media/placeholderAssets";

function parseListingPriceUsd(price: SearchResult["price"]): number | undefined {
  if (typeof price === "number" && Number.isFinite(price) && price > 0) {
    return price;
  }
  if (typeof price === "string") {
    const n = parseFloat(price.replace(/[^0-9.-]+/g, ""));
    if (!Number.isNaN(n) && n > 0) {
      return n;
    }
  }
  return undefined;
}

function mergePropertyImageUrls(result: SearchResult): string[] {
  const ordered: string[] = [];
  const seen = new Set<string>();
  const push = (raw?: string) => {
    const u = typeof raw === "string" ? raw.trim() : "";
    if (!u || seen.has(u)) return;
    seen.add(u);
    ordered.push(u);
  };
  push(result.imageUrl);
  for (const u of result.images ?? []) {
    push(u);
  }
  return ordered.length > 0 ? ordered : [DEFAULT_PLACEHOLDER_IMAGE];
}

function buildFeatureTags(result: SearchResult): string[] | undefined {
  const tags: string[] = [];
  if (typeof result.bedrooms === "number" && result.bedrooms >= 0) {
    tags.push(`${result.bedrooms} bed`);
  }
  if (typeof result.bathrooms === "number" && result.bathrooms >= 0) {
    tags.push(`${result.bathrooms} bath`);
  }
  if (typeof result.sqft === "number" && result.sqft > 0) {
    tags.push(`${result.sqft.toLocaleString()} sqft`);
  }
  return tags.length > 0 ? tags : undefined;
}

function listingDisplayName(result: SearchResult): string {
  const addr = typeof result.address === "string" ? result.address.trim() : "";
  if (!addr) {
    return "Property";
  }
  const max = 48;
  return addr.length <= max ? addr : `${addr.slice(0, max - 1)}…`;
}

/**
 * Maps a polygon/search row to a feed listing for reels (image carousel, bottom overlay).
 */
export function searchResultToFeedListing(result: SearchResult): FeedListing {
  const images = mergePropertyImageUrls(result);
  const thumbnailUrl = images[0] ?? DEFAULT_PLACEHOLDER_IMAGE;
  const price = parseListingPriceUsd(result.price);

  return {
    id: result.id,
    thumbnailUrl,
    images,
    mediaOrder: "imagesFirst",
    lat: result.lat,
    lng: result.lng,
    user: {
      id: result.id,
      name: listingDisplayName(result),
    },
    stats: { likes: 0, comments: 0 },
    price,
    zipCode: result.zipcode,
    city: result.city,
    state: result.state,
    features: buildFeatureTags(result),
  };
}
