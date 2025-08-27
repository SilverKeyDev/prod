import { formatFilenameToAddress, truncateText } from "../../lib/addressFormat";
import PropertyDetailsModal from "../modals/PropertyDetailsModal";
import { PropertyCard, Button } from "../ui";
import HeartSave from "../ui/HeartSave";
import {
  usePropertyDetails,
  type Property,
} from "../../hooks/usePropertyDetails";

export interface HomeDescription {
  home_id: string;
  description?: string;
  image_url?: string;
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
}: HomeCardProps) {
  const {
    isLoading,
    selectedProperty,
    fetchPropertyDetails,
    clearSelectedProperty,
  } = usePropertyDetails();

  // Format the home_id as an address if it contains address-like information
  const formattedAddress = formatFilenameToAddress(home.home_id);
  const rawDisplayName = formattedAddress || `Home ${home.home_id}`;
  const displayName = truncateText(rawDisplayName, 35);

  // Convert HomeDescription to Property format for API call
  const convertToProperty = (homeDesc: HomeDescription): Property => {
    return {
      id: homeDesc.home_id,
      address: formattedAddress || homeDesc.home_id,
      price:
        typeof homeDesc.price === "string"
          ? homeDesc.price
          : typeof homeDesc.price === "number"
          ? `$${homeDesc.price.toLocaleString()}`
          : "Price not available",
      bedrooms: homeDesc.bedrooms || 3,
      bathrooms: homeDesc.bathrooms || 2,
      sqft: homeDesc.sqft || 1500,
      lat: homeDesc.lat || 37.7749,
      lng: homeDesc.lng || -122.4194,
      images: homeDesc.image_url ? [homeDesc.image_url] : undefined,
    };
  };

  // Handle view details button click
  const handleViewDetails = async () => {
    const propertyData = convertToProperty(home);
    // Use address instead of zpid for HomeCard
    await fetchPropertyDetails(propertyData, true); // true flag indicates use address only
  };

  // Modal functions for property details
  const isHomeSavedForModal = (propertyId: string) => isHomeSaved(propertyId);
  const saveHomeForModal = async (property: any) => {
    await onSave(property);
  };
  const removeSavedHomeForModal = async (propertyId: string) => {
    await onRemove(propertyId);
  };

  return (
    <>
      <PropertyCard
        imageUrl={home.image_url}
        address={typeof displayName === "string" || typeof displayName === "number" 
          ? displayName.toString() 
          : "[Invalid address]"}
        price={home.price || "N/A"}
        bedrooms={home.bedrooms}
        bathrooms={home.bathrooms}
        sqft={home.sqft}
        propertyType={home.propertyType}
        lotSize={home.lot_size}
        pricePosition="top-left"
        loading={isLoading}
        onClick={handleViewDetails}
        topContent={
          <div className="bg-white rounded-full space-responsive-xs">
            <HeartSave
              property={convertToProperty(home)}
              isSaved={isHomeSaved(home.home_id)}
              onSave={onSave}
              onRemove={onRemove}
              size="sm"
            />
          </div>
        }
        bottomContent={
          <Button
            onClick={handleViewDetails}
            disabled={isLoading}
            loading={isLoading}
            variant="primary"
            size="md"
            fullWidth
          >
            View Details
          </Button>
        }
      />

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={selectedProperty}
        onClose={clearSelectedProperty}
        isHomeSaved={isHomeSavedForModal}
        saveHome={saveHomeForModal}
        removeSavedHome={removeSavedHomeForModal}
      />
    </>
  );
}
