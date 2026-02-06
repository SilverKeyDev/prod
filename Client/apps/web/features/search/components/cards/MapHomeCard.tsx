import {
  formatFilenameToAddress,
  truncateText,
  formatLotSize,
} from "../../../../../../packages/utils/search/address";
import {
  CardHeartSave,
  CardViewDetailsButton,
  TrianglePointer,
} from "../../../../components/cards/base";
import PropertyCard from "../../../../components/cards/PropertyCard";
import { log, LOG_CATEGORIES } from "../../../../../../logger";

export type HomeDescription = {
  home_id: string;
  description?: string;
  image_url?: string;
  calculatedScore?: number;
  // Common optional fields used across cards/modals
  address?: string;
  price?: string | number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lot_size?: string | number;
  lat?: number;
  lng?: number;
  [key: string]: unknown; // allow additional properties for future use
};

type MapHomeCardProps = {
  home: HomeDescription;
  /** Whether to show the match score next to price */
  showScore?: boolean;
  /** Whether this card is displayed on the map (adds triangle pointer) */
  isOnMap?: boolean;
  /** Function to focus on this property in the map/search */
  onFocus?: (property: any) => void;
  /** Function to handle unlock/view details click */
  onUnlock?: (home: HomeDescription) => void | Promise<void>;
  /** Optional save state functions for use outside React context (e.g., map markers) */
  isHomeSaved?: (propertyId: string, propertyAddress?: string) => boolean;
  saveHome?: (property: any) => Promise<void>;
  removeSavedHome?: (
    propertyId: string,
    propertyAddress?: string
  ) => Promise<void>;
};

/**
 * Pure presentational MapHomeCard that looks exactly like HomeCard but without React Query hooks
 * All data fetching should be done in parent components that are inside QueryClientProvider
 */
export default function MapHomeCard({
  home,
  showScore = false,
  isOnMap = false,
  onFocus,
  onUnlock,
}: MapHomeCardProps) {
  // Use actual address if available, otherwise format home_id
  const formattedAddress = formatFilenameToAddress(home.home_id);
  const actualAddress = home.address ?? formattedAddress;
  const rawDisplayName = actualAddress ?? `Home ${home.home_id}`;
  const displayName = truncateText(rawDisplayName, 35);

  // Convert HomeDescription to Property format for API call
  const convertToProperty = (homeDesc: HomeDescription) => {
    const usingFallbackLat = homeDesc.lat == null;
    const usingFallbackLng = homeDesc.lng == null;
    const lat = homeDesc.lat ?? 37.7749;
    const lng = homeDesc.lng ?? -122.4194;

    const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;
    log.debug(
      LOG_CATEGORIES.MAP_RENDERING,
      "🗺️ [MAP HOME CARD] convertToProperty coordinate mapping",
      {
        environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
        homeId: homeDesc.home_id,
        address: homeDesc.address,
        rawLat: homeDesc.lat,
        rawLng: homeDesc.lng,
        lat,
        lng,
        usingFallbackLat,
        usingFallbackLng,
      },
    );

    return {
      id: homeDesc.home_id,
      address: homeDesc.address ?? formattedAddress ?? homeDesc.home_id,
      price:
        typeof homeDesc.price === "string"
          ? homeDesc.price.startsWith("$")
            ? homeDesc.price
            : `$${homeDesc.price}`
          : typeof homeDesc.price === "number"
            ? `$${homeDesc.price.toLocaleString()}`
            : "Price not available",
      bedrooms: homeDesc.bedrooms ?? 3,
      bathrooms: homeDesc.bathrooms ?? 2,
      sqft: homeDesc.sqft ?? 1500,
      lat,
      lng,
      latitude: lat,
      longitude: lng,
      images: homeDesc.image_url ? [homeDesc.image_url] : undefined,
    };
  };

  // Use pre-calculated score if available
  const score = showScore ? home.calculatedScore : undefined;

  // Handle card click to focus on property
  const handleCardClick = () => {
    if (onFocus) {
      onFocus(convertToProperty(home));
    }
  };

  return (
    <div
      className={`relative cursor-pointer ${
        isOnMap ? "scale-90 transform" : ""
      }`}
      onClick={handleCardClick}
    >
      {/* Triangle pointer for map pins */}
      <TrianglePointer show={isOnMap} />

      <PropertyCard
        id={home.home_id}
        imageUrl={home.image_url}
        address={displayName}
        price={
          typeof home.price === "number"
            ? `$${home.price.toLocaleString()}`
            : typeof home.price === "string" && !home.price.startsWith("$")
              ? `$${home.price}`
              : (home.price ?? "N/A")
        }
        bedrooms={home.bedrooms as number | undefined}
        bathrooms={home.bathrooms as number | undefined}
        sqft={home.sqft && home.sqft > 0 ? home.sqft : undefined}
        lotSize={formatLotSize(home.lot_size as string | number | undefined)}
        pricePosition="below-address"
        cardType="searchpage"
        score={score}
        showScore={showScore}
        isOnMap={isOnMap}
        topContent={<CardHeartSave property={convertToProperty(home)} size="sm" />}
        bottomContent={
          <CardViewDetailsButton
            onClick={async () => {
              log.debug(
                LOG_CATEGORIES.MAP_RENDERING,
                "🔓 [MAP HOME CARD] View details clicked for map card",
                {
                  environment:
                    typeof import.meta !== "undefined" && import.meta.env?.DEV
                      ? "DEVELOPMENT"
                      : "PRODUCTION",
                  propertyId: home.home_id,
                  address: home.address?.substring(0, 30) + "...",
                  timestamp: new Date().toISOString(),
                  hasOnUnlockCallback: !!onUnlock,
                },
              );

              if (onUnlock) {
                try {
                  await onUnlock(home);
                  log.debug(
                    LOG_CATEGORIES.MAP_RENDERING,
                    "🔓 [MAP HOME CARD] onUnlock completed successfully",
                    {
                      environment:
                        typeof import.meta !== "undefined" &&
                        import.meta.env?.DEV
                          ? "DEVELOPMENT"
                          : "PRODUCTION",
                      propertyId: home.home_id,
                      timestamp: new Date().toISOString(),
                    },
                  );
                } catch (error) {
                  log.error(
                    LOG_CATEGORIES.MAP_RENDERING,
                    "🔓 [MAP HOME CARD] Error in onUnlock",
                    {
                      environment:
                        typeof import.meta !== "undefined" &&
                        import.meta.env?.DEV
                          ? "DEVELOPMENT"
                          : "PRODUCTION",
                      propertyId: home.home_id,
                      error:
                        error instanceof Error ? error.message : String(error),
                      timestamp: new Date().toISOString(),
                    },
                  );
                  throw error; // Re-throw to ensure CardViewDetailsButton handles the error
                }
              } else {
                log.warn(
                  LOG_CATEGORIES.MAP_RENDERING,
                  "🔓 [MAP HOME CARD] No onUnlock callback provided",
                  {
                    environment:
                      typeof import.meta !== "undefined" &&
                      import.meta.env?.DEV
                        ? "DEVELOPMENT"
                        : "PRODUCTION",
                    propertyId: home.home_id,
                    timestamp: new Date().toISOString(),
                  },
                );
              }
            }}
            size="sm"
            variant="primary"
            fullWidth
            text="Unlock"
          />
        }
      />
    </div>
  );
}

