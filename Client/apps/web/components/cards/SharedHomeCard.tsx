import { Home } from "lucide-react";

import {
  usePropertyDetails,
  type Property,
} from "../../../../packages/hooks/data/usePropertyDetails";

type SharedHomeCardProps = {
  homeId: string;
  address?: string;
  className?: string;
};

/**
 * Component to display a shared home card in chat messages
 * Shows a compact card that can be clicked to view full property details
 */
export default function SharedHomeCard({
  homeId,
  address,
  className = "",
}: SharedHomeCardProps) {
  const { fetchPropertyDetails } = usePropertyDetails();

  const handleViewDetails = async () => {
    // Create a property object to fetch details
    // Use homeId as address if address is not provided
    const propertyAddress = address ?? homeId;

    const propertyData: Property = {
      id: homeId,
      address: propertyAddress,
      price: "Price not available",
      bedrooms: 0,
      bathrooms: 0,
      sqft: 0,
      lat: 0,
      lng: 0,
      latitude: 0,
      longitude: 0,
    };

    await fetchPropertyDetails(propertyData);
  };

  // Show compact card for shared property
  return (
    <div className={`my-2 ${className}`}>
      <div
        onClick={handleViewDetails}
        className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-beige/20">
            <Home className="h-5 w-5 text-brown" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {address ?? `Property ${homeId}`}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Click to view property details
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
