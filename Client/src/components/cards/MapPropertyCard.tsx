import React from 'react';
import { createRoot } from 'react-dom/client';
import HomeCard from './HomeCard';

export interface MapPropertyCardProps {
  property: {
    id: string;
    address: string;
    price: string;
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    lotSize?: string;
    propertyType?: string;
    lat: number;
    lng: number;
    images?: string[];
    calculatedScore?: number;
  };
  isSaved?: boolean;
  onSave?: () => void;
  onUnsave?: () => void;
  showScore?: boolean;
}

const MapPropertyCard: React.FC<MapPropertyCardProps> = ({
  property,
  isSaved = false,
  onSave,
  onUnsave,
  showScore = true
}) => {
  // Convert property to HomeDescription format
  const homeData = {
    home_id: property.id,
    image_url: property.images?.[0],
    price: property.price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    sqft: property.sqft,
    lot_size: property.lotSize,
    propertyType: property.propertyType,
    lat: property.lat,
    lng: property.lng,
    address: property.address,
    calculatedScore: property.calculatedScore,
  };


  return (
    <div className="relative w-48">
      {/* Main card container with border only */}
      <div className="border-white rounded-lg">
        <HomeCard
          home={homeData}
          showScore={showScore}
          isOnMap={true}
          isHomeSaved={(_homeId) => isSaved}
          onSave={() => {
            onSave?.();
          }}
          onRemove={(_homeId) => {
            onUnsave?.();
          }}
        />
      </div>
      
      {/* Pointer triangle at the bottom */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white drop-shadow-md"></div>
      </div>
    </div>
  );
};

// Helper function to render MapPropertyCard into a DOM element
export const renderMapPropertyCard = (
  container: HTMLElement,
  props: MapPropertyCardProps
): void => {
  const root = createRoot(container);
  root.render(<MapPropertyCard {...props} />);
};

export default MapPropertyCard;
