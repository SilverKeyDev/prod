// React import not required with automatic JSX runtime
import { useNavigate } from "react-router-dom";

import {
  usePropertyDetails,
  type Property,
} from "../../../../packages/hooks/data/usePropertyDetails";
import {
  formatFilenameToAddress,
  truncateText,
  formatLotSize,
} from "../../../../packages/utils/address";
import ModalPortal from "../modals/ModalPortal";
import PropertyDetailsModal from "../modals/PropertyDetailsModal";

import { CardViewDetailsButton, CardHeartSave } from "./base";
import PropertyCard from "./PropertyCard";

// Safe navigation hook that handles cases outside Router context
const useSafeNavigate = () => {
  try {
    return useNavigate();
  } catch {
    // Return a no-op function if outside Router context
    return () => {};
  }
};

export type HomeDescription = {
  home_id: string;
  description?: string;
  image_url?: string;
  calculatedScore?: number;
  // Common optional fields used across cards/modals
  address?: string;
  price?: string | number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lot_size?: string | number;
  lat?: number;
  lng?: number;
  [key: string]: unknown; // allow additional properties for future use
};

type HomeCardProps = {
  home: HomeDescription;
  /** Function to check if home is saved */
  isHomeSaved?: (homeId: string) => boolean;
  /** Function to save the home */
  onSave?: (home: HomeDescription) => void | Promise<void>;
  /** Function to remove the home */
  onRemove?: (homeId: string) => void | Promise<void>;
  /** Whether to show the match score next to price */
  showScore?: boolean;
  /** Whether this card is displayed on the map (adds triangle pointer) */
  isOnMap?: boolean;
  /** Function to focus on this property in the map/search */
  onFocus?: (property: Property) => void;
};

/**
 * Simple presentation component to display a saved home.
 * Can be enhanced later with images, price, address, etc.
 */
export default function HomeCard({
  home,
  isHomeSaved = () => true, // Default to true since these are saved homes
  onSave = () => {},
  onRemove = () => {},
  showScore = false,
  isOnMap = false,
  onFocus,
}: HomeCardProps) {
  const navigate = useSafeNavigate();
  const {
    isLoading,
    selectedProperty,
    fetchPropertyDetails,
    clearSelectedProperty,
  } = usePropertyDetails();

  // Use actual address if available, otherwise format home_id
  const formattedAddress = formatFilenameToAddress(home.home_id);
  const actualAddress = home.address ?? formattedAddress;
  const rawDisplayName = actualAddress ?? `Home ${home.home_id}`;
  const displayName = truncateText(rawDisplayName, 35);

  // Convert HomeDescription to Property format for API call
  const convertToProperty = (homeDesc: HomeDescription): Property => {
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
      bedrooms: homeDesc.bedrooms ?? 3,
      bathrooms: homeDesc.bathrooms ?? 2,
      sqft: homeDesc.sqft ?? 1500,
      lat,
      lng,
      latitude: lat,
      longitude: lng,
      images: homeDesc.image_url ? [homeDesc.image_url] : undefined,
    };
  };

  // Use pre-calculated score if available
  const score = showScore ? home.calculatedScore : undefined;

  // Handle Unlock button click
  const handleViewDetails = async () => {
    const propertyData = convertToProperty(home);
    // Use address instead of zpid for HomeCard
    await fetchPropertyDetails(propertyData);
  };

  // Modal functions for property details
  const isHomeSavedForModal = (propertyId: string) => isHomeSaved(propertyId);
  const saveHomeForModal = async (
    property:
      | Property
      | import("../../../../packages/schemas/search").SearchResult,
  ) => {
    // Convert Property back to HomeDescription format for onSave
    type PropertyWithExtras = Property & {
      latitude?: number;
      longitude?: number;
      images?: string[];
      imageUrl?: string;
      price?: string | number; // Override price to allow both string and number
    };
    const prop = property as PropertyWithExtras;
    const homeDescription: HomeDescription = {
      home_id: prop.id,
      address: prop.address,
      price: (() => {
        if (typeof prop.price === "number") {
          return `$${(prop.price as number).toLocaleString()}`;
        } else if (typeof prop.price === "string") {
          return prop.price;
        } else {
          return "Price not available";
        }
      })(),
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      sqft: prop.sqft,
      lat: prop.lat ?? prop.latitude,
      lng: prop.lng ?? prop.longitude,
      image_url: prop.images?.[0] ?? prop.imageUrl,
      calculatedScore: home.calculatedScore, // Preserve original score
    };
    await onSave(homeDescription);
  };
  const removeSavedHomeForModal = async (propertyId: string) => {
    await onRemove(propertyId);
  };

  // Handle generate report navigation
  const handleGenerateReport = (address: string) => {
    // Save the address to localStorage for the GenerateReportPage
    const generateReportState = {
      address,
      comparisonAddress: "",
      reportType: "detailed",
      selectedClientId: "",
    };

    localStorage.setItem(
      "generateReportState",
      JSON.stringify(generateReportState),
    );

    // Navigate to the generate report page
    navigate("/dashboard/decide/generate-report");
  };

  // Handle card click to focus on property
  const handleCardClick = () => {
    if (onFocus) {
      onFocus(convertToProperty(home));
    }
  };

  return (
    <div
      className={`relative cursor-pointer ${isOnMap ? "scale-90 transform" : ""}`}
      onClick={handleCardClick}
    >
      {/* Triangle pointer for map pins */}
      {isOnMap && (
        <div className="absolute bottom-0 left-0 right-0 translate-y-full transform">
          <div className="border-t-16 h-0 w-full border-l-[96px] border-r-[96px] border-l-transparent border-r-transparent border-t-white"></div>
        </div>
      )}

      <PropertyCard
        id={home.home_id}
        imageUrl={home.image_url}
        address={displayName}
        price={
          typeof home.price === "number"
            ? `$${home.price.toLocaleString()}`
            : (home.price ?? "N/A")
        }
        bedrooms={home.bedrooms as number | undefined}
        bathrooms={home.bathrooms as number | undefined}
        sqft={home.sqft as number | undefined}
        lotSize={formatLotSize(home.lot_size as string | number | undefined)}
        pricePosition="below-address"
        loading={isLoading}
        cardType="searchpage"
        score={score}
        showScore={showScore}
        isOnMap={isOnMap}
        topContent={
          <CardHeartSave
            property={convertToProperty(home)}
            isSaved={isHomeSaved(home.home_id)}
            onSave={async (property) => {
              const prop = property as Property;
              const homeDesc: HomeDescription = {
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
        bottomContent={
          <CardViewDetailsButton
            onClick={handleViewDetails}
            loading={isLoading}
            size="sm"
            variant="primary"
            fullWidth
            text="Unlock"
          />
        }
      />

      {/* Property Details Modal */}
      {selectedProperty && (
        <ModalPortal>
          <PropertyDetailsModal
            property={selectedProperty}
            onClose={clearSelectedProperty}
            isHomeSaved={isHomeSavedForModal}
            saveHome={saveHomeForModal}
            removeSavedHome={removeSavedHomeForModal}
            onGenerateReport={handleGenerateReport}
          />
        </ModalPortal>
      )}
    </div>
  );
}
