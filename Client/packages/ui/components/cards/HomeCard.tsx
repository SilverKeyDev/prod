import type { CardHeartSavePropertyLike } from "@ui/button/HeartSave";
import type { KeyboardEvent } from "react";

import type { Property } from "packages/features/search/hooks/data/property/propertyDetailsTypes";
import {
  formatFilenameToAddress,
  formatLotSize,
  truncateText,
} from "packages/features/search/types/search/address";
import { Box } from "packages/ui/components/primitives";

import { CardHeartSaveWithProps, CardViewDetailsButton, TrianglePointer } from "./base/index";
import PropertyCard from "./PropertyCard";

export type HomeDescription = {
  home_id: string;
  description?: string;
  image_url?: string;
  calculatedScore?: number;
  address?: string;
  price?: string | number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lot_size?: string | number;
  lat?: number;
  lng?: number;
  [key: string]: unknown;
};

export type HomeCardSaveState = {
  isHomeSaved: (propertyId: string, propertyAddress?: string) => boolean;
  saveHome: (property: CardHeartSavePropertyLike) => Promise<void>;
  removeSavedHome: (propertyId: string, propertyAddress?: string) => Promise<void>;
};

type HomeCardProps = {
  home: HomeDescription;
  showScore?: boolean;
  isOnMap?: boolean;
  onFocus?: (property: Property) => void;
  /** When provided, the card shows a save/favorite heart using this state (e.g. from useSavedHomesData). */
  saveState?: HomeCardSaveState;
  /** Fetch/open property details (e.g. pass `fetchPropertyDetails` from `usePropertyDetails`). Modal lives in the parent to avoid ui → propertyDetails → ui cycles. */
  onViewDetails: (property: Property) => Promise<void>;
};

function convertHomeToProperty(home: HomeDescription, formattedAddress: string): Property {
  const lat = home.lat ?? 37.7749;
  const lng = home.lng ?? -122.4194;
  return {
    id: home.home_id,
    address: home.address ?? formattedAddress ?? home.home_id,
    price:
      typeof home.price === "string"
        ? home.price.startsWith("$")
          ? home.price
          : `$${home.price}`
        : typeof home.price === "number"
          ? `$${home.price.toLocaleString()}`
          : "Price not available",
    bedrooms: home.bedrooms ?? 3,
    bathrooms: home.bathrooms ?? 2,
    sqft: home.sqft ?? 1500,
    lat,
    lng,
    latitude: lat,
    longitude: lng,
    images: home.image_url ? [home.image_url] : undefined,
  };
}

function formatHomePrice(price: string | number | undefined): string {
  if (typeof price === "number") return `$${price.toLocaleString()}`;
  if (typeof price === "string" && !price.startsWith("$")) return `$${price}`;
  return (price as string) ?? "N/A";
}

type HomeCardViewProps = {
  isOnMap: boolean;
  onCardClick: () => void;
  onKeyDown: (e: KeyboardEvent) => void;
  home: HomeDescription;
  displayName: string;
  price: string;
  score: number | undefined;
  showScore: boolean;
  property: Property;
  saveState: HomeCardSaveState | undefined;
  onViewDetails: () => Promise<void>;
};

function HomeCardView({
  isOnMap,
  onCardClick,
  onKeyDown,
  home,
  displayName,
  price,
  score,
  showScore,
  property,
  saveState,
  onViewDetails,
}: HomeCardViewProps) {
  const propertyLike: CardHeartSavePropertyLike = {
    id: property.id,
    address: typeof property.address === "string" ? property.address : undefined,
  };
  const topContent = saveState ? (
    <CardHeartSaveWithProps
      property={propertyLike}
      isSaved={saveState.isHomeSaved(property.id, propertyLike.address)}
      saveHome={saveState.saveHome}
      removeSavedHome={saveState.removeSavedHome}
      size="sm"
      position="top-right"
    />
  ) : null;

  return (
    <Box
      role="button"
      tabIndex={0}
      className={`relative cursor-pointer ${isOnMap ? "scale-90 transform" : ""}`}
      onClick={onCardClick}
      onKeyDown={onKeyDown}
    >
      <TrianglePointer show={isOnMap} />
      <PropertyCard
        id={home.home_id}
        imageUrl={home.image_url}
        address={displayName}
        price={price}
        bedrooms={home.bedrooms as number | undefined}
        bathrooms={home.bathrooms as number | undefined}
        sqft={home.sqft && home.sqft > 0 ? home.sqft : undefined}
        lotSize={formatLotSize(home.lot_size as string | number | undefined)}
        pricePosition="below-address"
        cardType="searchpage"
        score={score}
        showScore={showScore}
        isOnMap={isOnMap}
        topContent={topContent}
        bottomContent={
          <CardViewDetailsButton
            onClick={onViewDetails}
            size="sm"
            variant="unlock"
            fullWidth
            text="View"
          />
        }
      />
    </Box>
  );
}

export default function HomeCard({
  home,
  showScore = false,
  isOnMap = false,
  onFocus,
  saveState,
  onViewDetails,
}: HomeCardProps) {
  const formattedAddress = formatFilenameToAddress(home.home_id);
  const displayName = truncateText(home.address ?? formattedAddress ?? `Home ${home.home_id}`, 35);
  const property = convertHomeToProperty(home, formattedAddress);
  const score = showScore ? home.calculatedScore : undefined;
  const price = formatHomePrice(home.price);

  const handleViewDetails = async () => {
    await onViewDetails(property);
  };

  const handleCardClick = () => onFocus?.(property);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <HomeCardView
      isOnMap={isOnMap}
      onCardClick={handleCardClick}
      onKeyDown={handleKeyDown}
      home={home}
      displayName={displayName}
      price={price}
      score={score}
      showScore={showScore}
      property={property}
      saveState={saveState}
      onViewDetails={handleViewDetails}
    />
  );
}
