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
import PropertyDetailsModal from "../modals/PropertyDetailsModal/PropertyDetailsModal";

import { CardViewDetailsButton, CardHeartSave, TrianglePointer } from "./base";
import PropertyCard from "./PropertyCard";

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
  showScore = false,
  isOnMap = false,
  onFocus,
}: HomeCardProps) {
  const {
    selectedProperty,
    fetchPropertyDetails,
    clearSelectedProperty,
    isLoading: isLoadingPropertyDetails,
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
          ? homeDesc.price.startsWith("$")
            ? homeDesc.price
            : `$${homeDesc.price}`
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

  const navigate = useNavigate();

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
      JSON.stringify(generateReportState)
    );

    // Navigate to the saved page
    navigate("/saved");
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
      <TrianglePointer show={isOnMap} />

      <PropertyCard
        id={home.home_id}
        imageUrl={home.image_url}
        address={displayName}
        price={
          typeof home.price === "number"
            ? `$${home.price.toLocaleString()}`
            : typeof home.price === "string" && !home.price.startsWith("$")
              ? `$${home.price}`
              : (home.price ?? "N/A")
        }
        bedrooms={home.bedrooms as number | undefined}
        bathrooms={home.bathrooms as number | undefined}
        sqft={home.sqft && home.sqft > 0 ? home.sqft : undefined}
        lotSize={formatLotSize(home.lot_size as string | number | undefined)}
        pricePosition="below-address"
        cardType="searchpage"
        score={score}
        showScore={showScore}
        isOnMap={isOnMap}
        topContent={
          <CardHeartSave property={convertToProperty(home)} size="sm" />
        }
        bottomContent={
          <CardViewDetailsButton
            onClick={handleViewDetails}
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
            onGenerateReport={handleGenerateReport}
            isLoading={isLoadingPropertyDetails}
          />
        </ModalPortal>
      )}
    </div>
  );
}
