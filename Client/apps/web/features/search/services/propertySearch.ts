import { searchApi } from "../../../../../packages/config/api/search";
import type {
  IsochroneData,
  UserPreferencesData,
  SearchByPolygonRequest,
  SearchByPolygonResponse,
  PropertySearchResult,
} from "../../../../../packages/schemas/api";

export type LatLng = {
  lat: number;
  lng: number;
};

export type SearchResult = {
  id: string;
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lat: number;
  lng: number;
  lotSize?: string;
  propertyType: string;
  listingStatus: string;
  imageUrl: string;
  _score: number;
};

export type UserPreferences = {
  home_budget: number;
  preferred_bedrooms: number;
  preferred_bathrooms: number;
  preferred_housing_type: string;
  preferred_home_age: string;
  preferred_lot_size: string;
  preferred_home_features: string[];
  deal_breakers: string[];
  important_locations: Array<{
    name: string;
    address: string;
    commute_tolerance: number;
    lat: number | null;
    lng: number | null;
  }>;
};

export type SearchByPolygonParams = {
  polygon: LatLng[];
  user_preferences: UserPreferences;
  status_type?: string;
  perBucketPages?: number;
  maxRetries?: number;
};

/**
 * Search properties within an isochrone polygon using the backend API
 */
export const searchPropertiesInIsochrone = async (
  isochroneData: IsochroneData,
  userPreferences: UserPreferencesData,
  setSearchStage: (stage: string) => void,
  setSearchResults: (results: SearchResult[]) => void,
  setIsSearching: (searching: boolean) => void,
  setHasSearched: (searched: boolean) => void,
  setCurrentPage: (page: number) => void,
  setShowPropertyModals: (show: boolean) => void,
  saveSearchResultsToLocalStorage: (results: SearchResult[]) => Promise<void>,
): Promise<void> => {
  setIsSearching(true);
  setSearchStage("Locating homes in your area...");
  setSearchResults([]);

  if (!isochroneData?.isochrone?.geometry) {
    console.warn("❌ No isochrone geometry available for property search");
    setIsSearching(false);
    return;
  }

  try {
    // Map current userPreferences to the backend format
    const { priceRange } = userPreferences;
    const { preferredBedrooms } = userPreferences;
    const searchUserPreferences: UserPreferences = {
      home_budget: priceRange?.max ?? 500000,
      preferred_bedrooms: preferredBedrooms ?? 3,
      preferred_bathrooms: Math.floor((preferredBedrooms ?? 3) / 2) + 1,
      preferred_housing_type: "single_family",
      preferred_home_age: "any",
      preferred_lot_size: "medium",
      preferred_home_features: [],
      deal_breakers: [],
      // Use ALL important_locations from the isochrone response
      important_locations: isochroneData.locations ?? [],
    };

    setSearchStage("Extracting property data...");

    // Call the backend API using the searchApi - backend expects user_preferences format
    const searchRequest: SearchByPolygonRequest = {
      user_preferences: searchUserPreferences,
      perBucketPages: 20,
    };

    console.log("🔍 [POLYGON_SEARCH] Making API request:", searchRequest);

    const searchResult = (await searchApi.searchByPolygon(
      searchRequest,
    )) as SearchByPolygonResponse;

    if (!searchResult.success) {
      throw new Error(searchResult.error ?? "Search failed");
    }

    // Show evaluating scores stage
    setSearchStage("Evaluating scores...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setSearchStage("Scoring homes based on your preferences...");

    // Transform API results to SearchResult format
    const transformedResults: SearchResult[] = (
      searchResult.properties ?? []
    ).map((property: PropertySearchResult, index: number) => ({
      id: property.zpid ?? `${Date.now()}-${index}`,
      address: property.address ?? "Address not available",
      price: property.price
        ? property.price.toLocaleString()
        : "Price not available",
      bedrooms: property.bedrooms ?? 0,
      bathrooms: property.bathrooms ?? 0,
      sqft: typeof property.livingArea === 'number' 
        ? property.livingArea
        : typeof property.livingArea === 'string'
          ? parseInt((property.livingArea as string).replace(/,/g, '')) || 0
          : 0,
      lat:
        property.latitude ??
        isochroneData.center.lat + (Math.random() - 0.5) * 0.01,
      lng:
        property.longitude ??
        isochroneData.center.lng + (Math.random() - 0.5) * 0.01,
      lotSize:
        property.lotAreaValue && property.lotAreaUnit
          ? `${property.lotAreaValue.toLocaleString()} ${property.lotAreaUnit}`
          : undefined,
      propertyType: property.propertyType ?? "Single Family",
      listingStatus: property.listingStatus ?? "For Sale",
      imageUrl: property.imgSrc ?? "/default-home.jpg",
      _score: property._score ?? 0, // Backend ML match score
    }));

    setSearchStage("Extracting property images...");
    await new Promise((resolve) => setTimeout(resolve, 800));

    setSearchStage("Finalizing results...");

    // Update search results and mark as searched
    setSearchResults(transformedResults);

    // Save search results to localStorage
    try {
      await saveSearchResultsToLocalStorage(transformedResults);
    } catch (error: unknown) {
      console.error("❌ Failed to save search results to localStorage:", error);
    }

    setHasSearched(true);
    setIsSearching(false);
    setCurrentPage(0);
    setShowPropertyModals(true);

    console.log(
      `✅ [POLYGON_SEARCH] Successfully found ${transformedResults.length} properties`,
    );
  } catch (error: unknown) {
    console.error("❌ Error in automatic isochrone property search:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      isochroneData,
    });
    setIsSearching(false);
    setSearchStage("");
  }
};
