import { useState } from 'react';
import { formatFilenameToAddress, truncateText } from "../lib/addressFormat";
import PropertyDetailsModal from './PropertyDetailsModal';
import { Eye, ExternalLink } from 'lucide-react';

export interface HomeDescription {
  home_id: string;
  description?: string;
  image_url?: string;
  [key: string]: any; // allow additional properties for future use
}

interface HomeCardProps {
  home: HomeDescription;
  onViewDetails?: (home: HomeDescription) => void;
}

/**
 * Simple presentation component to display a saved home.
 * Can be enhanced later with images, price, address, etc.
 */
export default function HomeCard({ home, onViewDetails }: HomeCardProps) {
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

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(home);
    } else {
      setShowModal(true);
    }
  };

  const handleGoToZillow = () => {
      // Fallback to general Zillow search
      const fallbackUrl = `https://www.zillow.com/homes/${encodeURIComponent(formattedAddress || home.home_id)}_rb/`;
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
  };

  // Mock functions for modal (these would typically come from parent component)
  const isHomeSaved = () => true; // Since this is already a saved home
  const saveHome = () => {}; // No-op since already saved
  const removeSavedHome = () => {}; // Could implement removal logic
  
  return (
    <div className="border rounded-lg shadow-sm bg-white hover:shadow-md transition overflow-hidden">
      {/* Image */}
      <div className="w-full h-48 bg-gray-100 overflow-hidden">
        <img
          src={home.image_url || placeholder}
          alt={home.description || displayName}
          className="object-cover w-full h-full"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 truncate" title={displayName}>
          {displayName}
        </h3>
        {home.description && (
          <p className="text-sm text-gray-700 line-clamp-3 mb-3">
            {home.description}
          </p>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleViewDetails}
            className="flex-1 bg-olive text-white py-2 px-3 rounded-lg hover:bg-olive-light transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
          
          <button
            onClick={handleGoToZillow}
            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2 text-sm font-medium"
            title="View on Zillow"
          >
            <ExternalLink className="w-4 h-4" />
            Zillow
          </button>
        </div>
      </div>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={showModal ? convertToProperty(home) : null}
        onClose={() => setShowModal(false)}
        isHomeSaved={isHomeSaved}
        saveHome={saveHome}
        removeSavedHome={removeSavedHome}
      />
    </div>
  );
}
