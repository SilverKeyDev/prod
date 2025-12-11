import { ArrowLeft, X } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

import { Card } from "../../../components/layout";
import { Title, Subtitle } from "../../../components/ui";
import Button from "../../../components/ui/button/Button";
import { PropertyCard } from "../../../components/cards";
import {
  CardHeartSave,
  CardViewDetailsButton,
} from "../../../components/cards/base";
import type { SavedHome } from "../../../../../packages/schemas";
import { usePropertyDetails } from "../../../../../packages/hooks/data/usePropertyDetails";

export type CompareHomesPageProps = {
  selectedHomes: SavedHome[];
  onClear: () => void;
  onRemove: (homeId: string) => void;
};

const CompareHomesPage: React.FC<CompareHomesPageProps> = ({
  selectedHomes,
  onClear,
  onRemove,
}) => {
  const navigate = useNavigate();
  const { fetchPropertyDetails } = usePropertyDetails();

  const handleUnlockHome = async (home: SavedHome) => {
    const propertyData = {
      id: home.home_id,
      address: String(home.address || home.description || ""),
      price:
        typeof home.price === "string"
          ? home.price.startsWith("$")
            ? home.price
            : `$${home.price}`
          : typeof home.price === "number"
            ? `$${home.price.toLocaleString()}`
            : "Price not available",
      bedrooms: home.bedrooms ?? 0,
      bathrooms: home.bathrooms ?? 0,
      sqft: home.sqft ?? 0,
      lat: home.lat ?? 0,
      lng: home.lng ?? 0,
      latitude: home.lat ?? 0,
      longitude: home.lng ?? 0,
      images: home.image_url ? [home.image_url] : undefined,
    };

    await fetchPropertyDetails(propertyData);
  };

  const handleBack = () => {
    // Navigate back to saved homes list - selections are preserved in localStorage
    navigate("/saved?view=homes", { replace: true });
  };

  if (selectedHomes.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-600">No homes selected for comparison.</p>
        <Button
          onClick={handleBack}
          variant="outline"
          size="sm"
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Saved Homes
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <Card className="mb-6">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleBack}
                variant="ghost"
                size="sm"
                icon={<ArrowLeft />}
                className="flex-shrink-0"
              >
                Back
              </Button>
              <div>
                <Title size="md" className="font-medium">
                  Compare Properties
                </Title>
                <Subtitle size="xs" muted className="mt-1">
                  {selectedHomes.length} propert
                  {selectedHomes.length === 1 ? "y" : "ies"} selected
                </Subtitle>
              </div>
            </div>
          </div>
          <Button
            onClick={onClear}
            variant="outline"
            size="sm"
            icon={<X />}
            disabled={selectedHomes.length === 0}
          >
            Clear All
          </Button>
        </div>
      </Card>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {selectedHomes.map((home: SavedHome) => (
          <div key={home.home_id} className="relative">
            <PropertyCard
              id={home.home_id}
              imageUrl={home.image_url}
              address={
                typeof home.address === "string" ||
                typeof home.address === "number"
                  ? home.address.toString()
                  : (home.description ?? "[Invalid address]")
              }
              price={
                typeof home.price === "string" || typeof home.price === "number"
                  ? home.price.toString()
                  : "[Invalid price]"
              }
              bedrooms={home.bedrooms}
              bathrooms={home.bathrooms}
              sqft={home.sqft && home.sqft > 0 ? home.sqft : undefined}
              lotSize={
                typeof home.lot_size === "string" ? home.lot_size : undefined
              }
              pricePosition="below-address"
              cardType="searchpage"
              showScore={false}
              topContent={
                <div className="flex items-center gap-2">
                  <CardHeartSave
                    property={{
                      id: home.home_id,
                      address: home.address ?? home.description ?? "",
                      price:
                        typeof home.price === "string" ||
                        typeof home.price === "number"
                          ? String(home.price)
                          : "",
                      bedrooms: home.bedrooms ?? 0,
                      bathrooms: home.bathrooms ?? 0,
                      sqft: home.sqft ?? 0,
                      lat: home.lat ?? 0,
                      lng: home.lng ?? 0,
                      images: home.image_url ? [home.image_url] : [],
                    }}
                    size="sm"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(home.home_id);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:ring-black/10 focus:outline-none focus:ring-2 focus:ring-black/20 focus:ring-offset-2 active:scale-95 text-gray-400 hover:text-red-500"
                    aria-label="Remove from comparison"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              }
              bottomContent={
                <CardViewDetailsButton
                  onClick={() => handleUnlockHome(home)}
                  size="sm"
                  variant="primary"
                  fullWidth
                  text="Unlock"
                />
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompareHomesPage;
