import { formatFilenameToAddress, truncateText } from "../../lib/addressFormat";
import PropertyDetailsModal from "../modals/PropertyDetailsModal";
import ModalPortal from "../modals/ModalPortal";
import PropertyCard from "./PropertyCard";
import { CardViewDetailsButton, CardHeartSave } from "./base";
import {
  usePropertyDetails,
  type Property,
} from "../../hooks/usePropertyDetails";
import { useNavigate } from "react-router-dom";

// Safe navigation hook that handles cases outside Router context
const useSafeNavigate = () => {
  try {
    return useNavigate();
  } catch (error) {
    // Return a no-op function if outside Router context
    return () => {};
  }
};

export interface HomeDescription {
  home_id: string;
  description?: string;
  image_url?: string;
  calculatedScore?: number;
  [key: string]: any; // allow additional properties for future use
}

interface HomeCardProps {
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
}

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
  const actualAddress = home.address || formattedAddress;
  const rawDisplayName = actualAddress || `Home ${home.home_id}`;
  const displayName = truncateText(rawDisplayName, 35);

  // Convert HomeDescription to Property format for API call
  const convertToProperty = (homeDesc: HomeDescription): Property => {
    const lat = homeDesc.lat || 37.7749;
    const lng = homeDesc.lng || -122.4194;
    return {
      id: homeDesc.home_id,
      address: homeDesc.address || formattedAddress || homeDesc.home_id,
      price:
        typeof homeDesc.price === "string"
          ? homeDesc.price
          : typeof homeDesc.price === "number"
          ? `$${homeDesc.price.toLocaleString()}`
          : "Price not available",
      bedrooms: homeDesc.bedrooms || 3,
      bathrooms: homeDesc.bathrooms || 2,
      sqft: homeDesc.sqft || 1500,
      lat: lat,
      lng: lng,
      latitude: lat,
      longitude: lng,
      images: homeDesc.image_url ? [homeDesc.image_url] : undefined,
    };
  };

  // Use pre-calculated score if available
  const score = showScore ? home.calculatedScore : undefined;

  // Handle view details button click
  const handleViewDetails = async () => {
    const propertyData = convertToProperty(home);
    // Use address instead of zpid for HomeCard
    await fetchPropertyDetails(propertyData, true); // true flag indicates use address only
  };

  // Modal functions for property details
  const isHomeSavedForModal = (propertyId: string) => isHomeSaved(propertyId);
  const saveHomeForModal = async (property: Property | any) => {
    // Convert Property back to HomeDescription format for onSave
    const homeDescription: HomeDescription = {
      home_id: property.id,
      address: property.address,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sqft: property.sqft,
      lat: property.lat || property.latitude,
      lng: property.lng || property.longitude,
      image_url: property.images?.[0],
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
      address: address,
      comparisonAddress: "",
      reportType: "detailed",
      selectedClientId: "",
    };

    localStorage.setItem(
      "generateReportState",
      JSON.stringify(generateReportState)
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
      className={`relative cursor-pointer ${
        isOnMap ? "transform scale-90" : ""
      }`}
      onClick={handleCardClick}
    >
      {/* Triangle pointer for map pins */}
      {isOnMap && (
        <div className="absolute bottom-0 left-0 right-0 transform translate-y-full">
          <div className="w-full h-0 border-l-[96px] border-r-[96px] border-t-16 border-l-transparent border-r-transparent border-t-white"></div>
        </div>
      )}

      <PropertyCard
        imageUrl={home.image_url}
        address={
          typeof displayName === "string" || typeof displayName === "number"
            ? displayName.toString()
            : "[Invalid address]"
        }
        price={home.price || "N/A"}
        bedrooms={home.bedrooms}
        bathrooms={home.bathrooms}
        sqft={home.sqft}
        lotSize={home.lot_size}
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
            onSave={onSave}
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
