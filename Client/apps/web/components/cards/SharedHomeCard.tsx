import { useMemo } from "react";

import { formatFilenameToAddress } from "../../../../packages/utils/search/address";
import { useSavedHomesData } from "../../../../packages/hooks/data/search/useSavedHomesData";
import {
  usePropertyDetails,
  type Property,
} from "../../../../packages/hooks/data/search/usePropertyDetails";
import PropertyCard from "./PropertyCard";

type SharedHomeCardProps = {
  homeId: string;
  address?: string;
  className?: string;
};

/**
 * Component to display a shared home card in chat messages
 * Shows a full property card with image, price, and details
 */
export default function SharedHomeCard({
  homeId,
  address,
  className = "",
}: SharedHomeCardProps) {
  const { getSavedHome } = useSavedHomesData();
  const { fetchPropertyDetails } = usePropertyDetails();

  // Get saved home data if available
  const savedHome = useMemo(() => {
    return getSavedHome(homeId);
  }, [homeId, getSavedHome]);

  // Format address from homeId if not provided
  const formattedAddress = useMemo(() => {
    if (address) return address;
    if (savedHome?.address) return savedHome.address;
    return formatFilenameToAddress(homeId) || `Property ${homeId}`;
  }, [address, savedHome, homeId]);

  // Convert saved home to PropertyCard props
  const propertyCardProps = useMemo(() => {
    const propertyAddress = formattedAddress;
    
    // Format price
    let priceStr = "Price not available";
    if (savedHome?.price) {
      if (typeof savedHome.price === "string") {
        priceStr = savedHome.price.startsWith("$")
          ? savedHome.price
          : `$${savedHome.price}`;
      } else if (typeof savedHome.price === "number") {
        priceStr = `$${savedHome.price.toLocaleString()}`;
      }
    }

    return {
      id: homeId,
      imageUrl: savedHome?.image_url,
      address: propertyAddress,
      price: priceStr,
      bedrooms: savedHome?.bedrooms,
      bathrooms: savedHome?.bathrooms,
      sqft: savedHome?.sqft,
      cardType: "regular" as const,
      showScore: false,
    };
  }, [homeId, formattedAddress, savedHome]);

  const handleViewDetails = async () => {
    // Create a property object to fetch details
    const propertyData: Property = {
      id: homeId,
      address: formattedAddress,
      price: propertyCardProps.price,
      bedrooms: savedHome?.bedrooms ?? 0,
      bathrooms: savedHome?.bathrooms ?? 0,
      sqft: savedHome?.sqft ?? 0,
      lat: savedHome?.lat ?? 0,
      lng: savedHome?.lng ?? 0,
      latitude: savedHome?.lat ?? 0,
      longitude: savedHome?.lng ?? 0,
      images: savedHome?.image_url ? [savedHome.image_url] : undefined,
    };

    await fetchPropertyDetails(propertyData);
  };

  // Render full property card
  return (
    <div className={`my-2 ${className}`}>
      <PropertyCard
        {...propertyCardProps}
        onClick={handleViewDetails}
      />
    </div>
  );
}
