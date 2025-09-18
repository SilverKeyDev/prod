import { MapPin, Bookmark } from "lucide-react";

import {
  CardImageContainer,
  CardPropertyDetails,
  CardMatchScore,
  CardHeartSave,
} from "../../../../components/cards/base";
import KeyTurnLoader from "../../../../components/ui/loading/KeyTurnLoader";
import { type PropertyDetails } from "../../../../core/schemas/search";

export function SidebarList(props: {
  items: PropertyDetails[];
  selectedId?: string;
  isLoading: boolean;
  isHomeSaved: (id: string) => boolean;
  savedAddresses?: Set<string>;
  onSave: (p: PropertyDetails) => void;
  removeSavedHome: (id: string) => void;
  onPropertyFocus: (property: PropertyDetails) => void;
  activeTab: "results" | "saved";
}): JSX.Element {
  const {
    items,
    selectedId,
    isLoading,
    isHomeSaved,
    savedAddresses,
    onSave,
    removeSavedHome,
    onPropertyFocus,
    activeTab,
  } = props;

  // Use centralized score calculation
  const calculatePropertyScore = (property: PropertyDetails) => {
    return property._score || property.calculatedScore || 0;
  };

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        {activeTab === "results" ? (
          <>
            <MapPin className="mobile-icon-lg mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Loosen preferences to expand options</p>
          </>
        ) : (
          <>
            <Bookmark className="mx-auto mb-2 h-6 w-6 text-gray-300 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12" />
            <p className="text-sm">No saved homes yet</p>
            <p className="mt-1 text-xs">
              Click the heart icon to save properties
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="scrollbar-hide h-full space-y-3 overflow-y-auto pr-2">
      {items.map((property: PropertyDetails) => {
        return (
          <div
            key={property.id}
            className={`relative overflow-hidden rounded-lg border transition-all ${
              selectedId === property.id
                ? "border-brown bg-brown/5"
                : "border-gray-200"
            }`}
            onClick={() => {
              onPropertyFocus(property);
            }}
          >
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm">
                <KeyTurnLoader message="Loading details..." />
              </div>
            )}
            {/* Property Image */}
            <CardImageContainer
              imageUrl={
                (property as any).imageUrl ||
                (property as any).image_url ||
                (property as any).imageSrc ||
                (property as any).imgSrc ||
                (property as any).images?.[0]?.url ||
                (property as any).imgUrl
              }
              alt={property.address ?? "Property image"}
              height={activeTab === "results" ? "sm" : "responsive"}
              imageVariant="professional"
              className={activeTab === "saved" ? "rounded-t-lg" : ""}
            />

            <div
              className={
                activeTab === "results" ? "p-3" : "space-responsive-xs"
              }
            >
              <div
                className={`${activeTab === "results" ? "mb-2 flex items-start justify-between gap-2" : "gap-responsive-sm mb-2 flex items-start justify-between"}`}
              >
                <div className="min-w-0 flex-1">
                  {activeTab === "saved" && (
                    <div className="mb-1 flex items-center gap-2">
                      {typeof property.propertyType === "string" &&
                        property.propertyType.toUpperCase() !==
                          "SINGLE_FAMILY" && (
                          <span className="text-responsive-xs rounded bg-gray-100 px-2 py-0.5 text-gray-700">
                            {property.propertyType}
                          </span>
                        )}
                    </div>
                  )}

                  {/* Address */}
                  <h3 className="text-responsive-sm mb-1 line-clamp-2 font-medium text-black">
                    {typeof property.address === "string" ||
                    typeof property.address === "number"
                      ? property.address
                      : "[Invalid address]"}
                  </h3>

                  {/* Price and Match Score */}
                  <div className="justify-left flex">
                    <p
                      className={`text-responsive-sm flex-1 font-semibold text-brown ${activeTab === "saved" ? "text-responsive-lg mb-2" : ""}`}
                    >
                      {typeof property.price === "string"
                        ? property.price.startsWith("$")
                          ? property.price
                          : `$${property.price}`
                        : typeof property.price === "number"
                          ? `$${property.price.toLocaleString()}`
                          : "[Invalid price]"}
                    </p>
                    {activeTab === "results" && (
                      <CardMatchScore
                        score={calculatePropertyScore(property)}
                        size="xs"
                        useColorStyling={true}
                        className="ml-2"
                      />
                    )}
                  </div>

                  {/* Property Details */}
                  <CardPropertyDetails
                    bedrooms={property.bedrooms}
                    bathrooms={property.bathrooms}
                    sqft={
                      property.sqft && property.sqft > 0
                        ? property.sqft
                        : undefined
                    }
                    lotSize={property.lotSize}
                    variant="horizontal"
                    className="mb-2 sm:mb-3"
                    hideSquareFootage={!property.sqft || property.sqft === 0}
                  />
                </div>
                <CardHeartSave
                  property={property}
                  isSaved={
                    activeTab === "saved"
                      ? true
                      : isHomeSaved(property.id) ||
                        (!!property.address &&
                          !!savedAddresses?.has(
                            property.address.toLowerCase().trim()
                          ))
                  }
                  onSave={(prop: unknown) => onSave(prop as PropertyDetails)}
                  onRemove={removeSavedHome}
                  size="sm"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
