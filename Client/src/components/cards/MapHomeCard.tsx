import { memo } from "react";

import {
  formatFilenameToAddress,
  truncateText,
  formatLotSize,
} from "../../core/utils/address";

import { CardHeartSave } from "./base";
import PropertyCard from "./PropertyCard";

export type MapHomeDescription = {
  home_id: string;
  description?: string;
  image_url?: string;
  calculatedScore?: number;
  // Common optional fields used across cards/modals
  address?: string;
  price?: string | number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lot_size?: string | number;
  lat?: number;
  lng?: number;
};

type MapHomeCardProps = {
  home: MapHomeDescription;
  /** Function to check if home is saved */
  isHomeSaved?: (homeId: string) => boolean;
  /** Function to save the home */
  onSave?: (home: MapHomeDescription) => void | Promise<void>;
  /** Function to remove the home */
  onRemove?: (homeId: string) => void | Promise<void>;
  /** Whether to show the match score next to price */
  showScore?: boolean;
  /** Whether this card is displayed on the map (adds triangle pointer) */
  isOnMap?: boolean;
  /** Force show placeholder image (desktop map markers should show blank like sidebar) */
  forceNoImagePlaceholder?: boolean;
  /** Normalized set of saved addresses for cross-checking saved state */
  savedAddresses?: Set<string>;
  /** Current active tab */
  activeTab?: "results" | "saved";
};

/**
 * Simplified HomeCard component for use in map contexts where QueryClient is not available
 * This component doesn't use the property details functionality to avoid QueryClient errors
 */
const MapHomeCard = memo(function MapHomeCard({
  home,
  isHomeSaved = () => false, // Default to false for search results
  onSave = () => {},
  onRemove = () => {},
  showScore = false,
  isOnMap = false,
  savedAddresses,
  activeTab = "results",
}: MapHomeCardProps) {
  // Add defensive programming to handle undefined/null home
  if (!home) {
    console.error("MapHomeCard: home prop is undefined or null");
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
        <p className="text-red-700">Error: No home data provided</p>
      </div>
    );
  }

  // Validate required home properties
  if (!home.home_id) {
    console.error("MapHomeCard: home.home_id is missing");
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
        <p className="text-red-700">Error: Home ID is missing</p>
      </div>
    );
  }

  // Use actual address if available, otherwise format home_id
  const formattedAddress = formatFilenameToAddress(home.home_id);
  const actualAddress = home.address ?? formattedAddress;
  const rawDisplayName = actualAddress ?? `Home ${home.home_id}`;
  const displayName = truncateText(rawDisplayName, 35);

  // Use pre-calculated score if available
  const score = showScore ? home.calculatedScore : undefined;

  // Convert MapHomeDescription to Property format for CardHeartSave
  const convertToProperty = (homeDesc: MapHomeDescription) => {
    // Add defensive programming for required fields
    if (!homeDesc?.home_id) {
      console.error("convertToProperty: Invalid homeDesc provided", homeDesc);
      throw new Error("Invalid home data provided to convertToProperty");
    }

    const lat = homeDesc.lat ?? 37.7749;
    const lng = homeDesc.lng ?? -122.4194;

    return {
      id: homeDesc.home_id,
      address: homeDesc.address ?? formattedAddress ?? homeDesc.home_id,
      price:
        typeof homeDesc.price === "string"
          ? homeDesc.price
          : typeof homeDesc.price === "number"
            ? `$${homeDesc.price.toLocaleString()}`
            : "Price not available",
      bedrooms: homeDesc.bedrooms,
      bathrooms: homeDesc.bathrooms,
      sqft: homeDesc.sqft,
      lat,
      lng,
      latitude: lat,
      longitude: lng,
      images: homeDesc.image_url ? [homeDesc.image_url] : undefined,
    };
  };

  return (
    <div
      className={`relative cursor-pointer ${isOnMap ? "scale-90 transform" : ""}`}
    >
      {/* Triangle pointer for map pins */}
      {isOnMap && (
        <div className="absolute bottom-0 left-0 right-0 translate-y-full transform">
          <div className="border-t-16 h-0 w-full border-l-[96px] border-r-[96px] border-l-transparent border-r-transparent border-t-white"></div>
        </div>
      )}

      <PropertyCard
        id={home.home_id}
        imageUrl={
          (home as any).image_url ||
          (home as any).imageUrl ||
          (home as any).imageSrc ||
          (home as any).imgSrc ||
          (home as any).images?.[0] ||
          (home as any).imgUrl
        }
        address={displayName}
        price={
          typeof home.price === "number"
            ? `$${home.price.toLocaleString()}`
            : (home.price ?? "N/A")
        }
        bedrooms={home.bedrooms}
        bathrooms={home.bathrooms}
        sqft={home.sqft === 0 ? undefined : home.sqft}
        lotSize={formatLotSize(home.lot_size)}
        pricePosition="below-address"
        loading={false}
        cardType="searchpage"
        score={score}
        showScore={showScore}
        isOnMap={isOnMap}
        hideSquareFootage={true}
        showSquareFootage={false}
        topContent={
          <CardHeartSave
            property={convertToProperty(home)}
            isSaved={
              activeTab === "saved"
                ? true
                : isHomeSaved(home.home_id) ||
                  (!!home.address &&
                    !!savedAddresses?.has(home.address.toLowerCase().trim()))
            }
            onSave={async (property) => {
              const prop = property as any;
              const homeDesc: MapHomeDescription = {
                home_id: prop.id,
                address: prop.address,
                price: prop.price,
                bedrooms: prop.bedrooms,
                bathrooms: prop.bathrooms,
                sqft: prop.sqft,
                lat: prop.lat ?? prop.latitude,
                lng: prop.lng ?? prop.longitude,
                image_url: prop.images?.[0],
                calculatedScore: home.calculatedScore,
              };
              await onSave(homeDesc);
            }}
            onRemove={onRemove}
            size="sm"
          />
        }
        // No bottom content for map cards to keep them simple
      />
    </div>
  );
});

export default MapHomeCard;
