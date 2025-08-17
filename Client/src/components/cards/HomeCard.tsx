import { formatFilenameToAddress, truncateText } from "../../lib/addressFormat";
import PropertyDetailsModal from "../modals/PropertyDetailsModal";
import HeartSave from "../ui/HeartSave";
import KeyTurnLoader from "../ui/KeyTurnLoader";
import { MapPin, Bed, Bath, Square } from "lucide-react";
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
  const placeholder = "https://placehold.co/600x400?text=No+Image";

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
    <div
      className={`bg-white rounded-xl shadow-sm border border-beige/40 overflow-hidden hover:shadow-md transition-shadow duration-200 ${
        isLoading ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={home.image_url || placeholder}
          alt={home.description || displayName}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Price Badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-sm font-semibold text-navy">
            {typeof home.price === "string" || typeof home.price === "number"
              ? typeof home.price === "string" && home.price.startsWith("$")
                ? home.price
                : `$${home.price?.toLocaleString() || "N/A"}`
              : "[Invalid price]"}
          </span>
        </div>

        {/* Heart Save Button */}
        <div className="absolute top-3 right-3 bg-white rounded-full p-1">
          <HeartSave
            property={convertToProperty(home)}
            isSaved={isHomeSaved(home.home_id)}
            onSave={onSave}
            onRemove={onRemove}
            size="sm"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Address */}
        <div className="flex items-start gap-2 mb-3">
          <MapPin className="h-4 w-4 text-brown mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-navy leading-tight">
              {typeof displayName === "string" ||
              typeof displayName === "number"
                ? displayName
                : "[Invalid address]"}
            </p>
          </div>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="flex items-center gap-1">
            <Bed className="h-3 w-3 text-brown" />
            <span className="text-xs text-gray-600">
              {home.bedrooms || 0} bed{(home.bedrooms || 0) !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-3 w-3 text-brown" />
            <span className="text-xs text-gray-600">
              {home.bathrooms || 0} bath{(home.bathrooms || 0) !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Square className="h-3 w-3 text-brown" />
            <span className="text-xs text-gray-600">
              {(home.sqft || 0).toLocaleString()} sqft
            </span>
          </div>
        </div>

        {/* Additional Details */}
        <div className="space-y-2 mb-3">
          {/* Home Type */}
          {home.propertyType && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Type:</span>
              <span className="text-xs font-medium text-navy">
                {home.propertyType
                  .replace(/_/g, " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </span>
            </div>
          )}

          {/* Lot Size */}
          {home.lot_size && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Lot:</span>
              <span className="text-xs font-medium text-navy">
                {home.lot_size}
              </span>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <button
          onClick={handleViewDetails}
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded-lg transition-colors text-sm font-medium flex items-center justify-center ${
            isLoading
              ? "bg-brown/70 text-white cursor-not-allowed"
              : "bg-brown text-white hover:bg-brown/90"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <KeyTurnLoader />
            </div>
          ) : (
            "View Details"
          )}
        </button>
      </div>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={selectedProperty}
        onClose={clearSelectedProperty}
        isHomeSaved={isHomeSavedForModal}
        saveHome={saveHomeForModal}
        removeSavedHome={removeSavedHomeForModal}
      />
    </div>
  );
}
