import { MapPin, Bookmark } from "lucide-react";

import {
  CardImageContainer,
  CardPropertyDetails,
  CardMatchScore,
  CardHeartSave,
} from "../../../components/cards/base";
import { KeyTurnLoader } from "../../../components/ui";
import {
  getMatchScore,
  type SearchResult,
} from "../../../../../packages/schemas/search";

export function SidebarList(props: {
  items: SearchResult[];
  selectedId?: string;
  isLoading: boolean;
  onNavigateToProperty: (p: SearchResult) => void;
  activeTab: "results" | "saved";
  // Optional saved-home controls from parent to keep UI in sync
  isHomeSaved?: (id: string, address?: string) => boolean;
  saveHome?: (p: SearchResult) => Promise<void>;
  removeSavedHome?: (id: string, address?: string) => Promise<void>;
}): JSX.Element {
  const {
    items,
    selectedId,
    isLoading,
    onNavigateToProperty,
    activeTab,
    isHomeSaved,
    saveHome,
    removeSavedHome,
  } = props;

  // Use centralized score calculation
  const calculatePropertyScore = (property: SearchResult) => {
    return getMatchScore(property);
  };

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        {activeTab === "results" ? (
          <>
            <MapPin className="mobile-icon-lg mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Click on the map to search for properties</p>
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
      {items.map((property: SearchResult) => (
        <div
          key={property.id}
          className={`relative cursor-pointer overflow-hidden rounded-lg border transition-all ${
            selectedId === property.id
              ? "border-brown bg-brown/5"
              : "border-gray-200 hover:border-brown/50 hover:bg-gray-50"
          }`}
          onClick={() => onNavigateToProperty(property)}
        >
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm">
              <KeyTurnLoader message="Loading details..." />
            </div>
          )}
          {/* Property Image */}
          <CardImageContainer
            imageUrl={property.imageUrl}
            alt={property.address ?? "Property image"}
            height={activeTab === "results" ? "sm" : "responsive"}
            imageVariant="professional"
            className={activeTab === "saved" ? "rounded-t-lg" : ""}
          />

          <div
            className={activeTab === "results" ? "p-3" : "space-responsive-xs"}
          >
            <div
              className={`${activeTab === "results" ? "mb-2 flex items-start justify-between gap-2" : "gap-responsive-sm mb-2 flex items-start justify-between"}`}
            >
              <div className="min-w-0 flex-1">
                {activeTab === "saved" && (
                  <div className="mb-1 flex items-center gap-2">
                    {typeof property.propertyType === "string" &&
                      property.propertyType.toLowerCase() !==
                        "single_family" && (
                        <span className="text-xs text-gray-500 capitalize">
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
                        ? `$${property.price}`
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
                  sqft={property.sqft}
                  lotSize={property.lotSize}
                  variant="horizontal"
                  className="mb-2 sm:mb-3"
                />
              </div>
              <CardHeartSave
                property={property}
                size="sm"
                isHomeSaved={isHomeSaved}
                saveHome={
                  saveHome
                    ? async (propertyArg) =>
                        // property could be SearchResult or Property. Convert Property to SearchResult shape if necessary.
                        saveHome(
                          "price" in propertyArg &&
                            typeof propertyArg.price === "number"
                            ? {
                                ...propertyArg,
                                price: propertyArg.price.toString(),
                              }
                            : (propertyArg as any)
                        )
                    : undefined
                }
                removeSavedHome={removeSavedHome}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
