import type { PropertyDetails, PropertyType, ListingStatus, SearchResult } from "../../../core/schemas/search";

export function mapBackendPropertyToDetails(p: any): PropertyDetails {
  const mapped = {
    id: p.id || p.property_id || String(p.zpid || Math.random()),
    address: p.address || p.streetAddress || "Address not available",
    price: p.price ?? p.listPrice ?? "N/A",
    bedrooms: p.bedrooms ?? p.beds ?? 0,
    bathrooms: p.bathrooms ?? p.baths ?? 0,
    sqft: p.sqft ?? p.livingArea ?? 0,
    lat: p.lat ?? p.latitude ?? 0,
    lng: p.lng ?? p.longitude ?? 0,
    lotSize: p.lotSize ?? p.lotAreaValue,
    propertyType: (p.propertyType || p.homeType || "SINGLE_FAMILY") as PropertyType,
    listingStatus: (p.listingStatus || p.homeStatus || "FOR_SALE") as ListingStatus,
    imageUrl: p.imageUrl || p.image_url || p.imageSrc || p.imgSrc || p.images?.[0]?.url || p.imgUrl,
    _score: p._score ?? p.score ?? 0,
  };

  // Removed verbose mapping debug logging

  return mapped;
}

export function mapDetailsToSearchResult(details: PropertyDetails): SearchResult {
  return {
    id: details.id,
    address: details.address,
    price: typeof details.price === "string" ? details.price : details.price.toString(),
    bedrooms: details.bedrooms,
    bathrooms: details.bathrooms,
    sqft: details.sqft,
    lat: details.lat,
    lng: details.lng,
    lotSize: details.lotSize,
    propertyType: details.propertyType,
    listingStatus: details.listingStatus,
    imageUrl: (details as any).imageUrl || (details as any).image_url || (details as any).imageSrc || (details as any).imgSrc || (details as any).images?.[0]?.url || (details as any).imgUrl,
    _score: details._score,
  };
}


