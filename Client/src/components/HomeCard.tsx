import { useState } from 'react';
import { formatFilenameToAddress, truncateText } from "../lib/addressFormat";
import PropertyDetailsModal from './PropertyDetailsModal';
import HeartSave from './HeartSave';

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
  onRemove = () => {} 
}: HomeCardProps) {
  const [showModal, setShowModal] = useState(false);
  const placeholder = "https://placehold.co/600x400?text=No+Image";
  
  // Format the home_id as an address if it contains address-like information
  const formattedAddress = formatFilenameToAddress(home.home_id);
  const rawDisplayName = formattedAddress || `Home ${home.home_id}`;
  const displayName = truncateText(rawDisplayName, 35);

  // Convert HomeDescription to Property format for modal
  const convertToProperty = (homeDesc: HomeDescription) => {
    return {
      id: homeDesc.home_id,
      address: formattedAddress || homeDesc.home_id,
      price: homeDesc.price || 'Price not available',
      bedrooms: homeDesc.bedrooms || 3,
      bathrooms: homeDesc.bathrooms || 2,
      sqft: homeDesc.sqft || 1500,
      lat: homeDesc.lat || 37.7749,
      lng: homeDesc.lng || -122.4194,
      images: homeDesc.image_url ? [homeDesc.image_url] : undefined
    };
  };

  // Modal functions for property details
  const isHomeSavedForModal = () => true; // Since this is already a saved home
  const saveHomeForModal = () => {}; // No-op since already saved
  const removeSavedHomeForModal = () => {}; // Could implement removal logic
  
  return (
    <div className="border rounded-lg shadow-sm bg-white hover:shadow-md transition overflow-hidden">
      {/* Image */}
      <div className="w-full h-32 bg-gray-100 overflow-hidden">
        <img
          src={home.image_url || placeholder}
          alt={home.description || displayName}
          className="object-cover w-full h-full"
          loading="lazy"
        />
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            {/* Property Type and Status (if available) */}
            <div className="flex items-center gap-2 mb-1">
              {home.propertyType &&
                home.propertyType.toLowerCase() !== "single_family" && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    {home.propertyType}
                  </span>
                )}
              {typeof home.listingStatus === "string" &&
                home.listingStatus.toLowerCase() !== "for_sale" && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    {home.listingStatus}
                  </span>
                )}
            </div>

            {/* Address */}
            <h3 className="text-sm font-medium text-black line-clamp-2 mb-1">
              {typeof displayName === "string" || typeof displayName === "number"
                ? displayName
                : "[Invalid address]"}
            </h3>

            {/* Price */}
            <p className="text-lg font-semibold text-brown mb-2">
              {typeof home.price === "string" || typeof home.price === "number"
                ? (typeof home.price === 'string' && home.price.startsWith('$') 
                    ? home.price 
                    : `$${home.price?.toLocaleString() || 'N/A'}`)
                : "[Invalid price]"}
            </p>

            {/* Property Details - exactly like search results */}
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-1">
              <div>{home.bedrooms || 0} beds</div>
              <div>{home.bathrooms || 0} baths</div>
              {(home.sqft && home.sqft > 0) && (
                <div>
                  {home.sqft.toLocaleString()} sqft
                </div>
              )}
            </div>

            {/* Lot Size */}
            {home.lot_size && (
              <div className="text-xs text-gray-500">
                Lot: {home.lot_size}
              </div>
            )}
          </div>
          <HeartSave
            property={convertToProperty(home)}
            isSaved={isHomeSaved(home.home_id)}
            onSave={onSave}
            onRemove={onRemove}
            size="sm"
          />
        </div>
      </div>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={showModal ? convertToProperty(home) : null}
        onClose={() => setShowModal(false)}
        isHomeSaved={isHomeSavedForModal}
        saveHome={saveHomeForModal}
        removeSavedHome={removeSavedHomeForModal}
      />
    </div>
  );
}
