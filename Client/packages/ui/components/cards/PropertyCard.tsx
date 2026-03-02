import React, { useState } from "react";

import { getEnv } from "packages/config";
import { useWhyRender } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { Property } from "packages/schemas/property";
import { BodyText } from "packages/ui/components/index.web";

import type { SearchResult } from "@/features/search/types";

import { CardNotInterested, StyledImage } from "./base/index.web";
import BaseCard from "./BaseCard";
import {
  PropertyCardDetailsRow,
  PropertyCardHideImageHeader,
  PropertyCardPriceRow,
  PropertyCardTrianglePointer,
} from "./PropertyCardBodySection";
import WhyNotInterestedCard from "./WhyNotInterestedCard.web";

export type PropertyCardProps = {
  /** Stable ID for memoization */
  id: string;
  /** Property image URL */
  imageUrl?: string;
  /** Property address */
  address: string;
  /** Match score (0-100) */
  score?: number;
  /** Property price */
  price: string;
  /** Property details */
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lotSize?: string;
  propertyType?: string;
  status?: { text: string; className: string };
  /** Card actions */
  onViewDetails?: () => void;
  /** Card state */
  loading?: boolean;
  /** Card type for appropriate sizing */
  cardType?: "searchpage" | "regular";
  /** Price position */
  pricePosition?: "top-left" | "top-right" | "below-address";
  /** Top content (e.g., heart save button) */
  topContent?: React.ReactNode;
  /** Bottom content (e.g., Unlock button) */
  bottomContent?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Custom styling */
  className?: string;
  showScore?: boolean;
  /** Whether to hide square footage */
  hideSquareFootage?: boolean;
  /** Whether to show triangle pointer for map cards */
  showTrianglePointer?: boolean;
  /** Whether this card is displayed on the map */
  isOnMap?: boolean;
  /** Whether to hide the image section (for mobile carousel) */
  hideImage?: boolean;
  /** Property object for not interested functionality */
  property?: SearchResult | Property;
  /** Callback when reason is selected for not interested */
  onSelectNotInterestedReason?: (why: string) => Promise<void>;
  /** Callback when not interested is undone */
  onUndoNotInterested?: () => Promise<void>;
  /** Whether to show not interested button (only in results tab) */
  showNotInterested?: boolean;
  /** Card width override */
  width?: "auto" | "full" | "standard" | "wide" | "narrow";
};

function formatPrice(price: string | number): string {
  if (typeof price === "number") {
    return `$${price.toLocaleString()}`;
  }
  const priceStr = price.toString();
  return priceStr.startsWith("$") ? priceStr : `$${priceStr}`;
}

function PropertyCardImageSection({
  imageUrl,
  address,
  cardType,
  status,
  pricePosition,
  price,
  topContent,
  showNotInterested,
  property,
  onMarkNotInterested,
}: {
  imageUrl: string;
  address: string;
  cardType: "searchpage" | "regular";
  status?: { text: string; className: string };
  pricePosition: "top-left" | "top-right" | "below-address";
  price: string;
  topContent?: React.ReactNode;
  showNotInterested: boolean;
  property?: SearchResult | Property;
  onMarkNotInterested: () => void;
}) {
  const placeholder = "/api/placeholder/400/300";
  const heightClass = cardType === "searchpage" ? "h-24 sm:h-28 md:h-32" : "h-32 sm:h-40 md:h-48";
  return (
    <div className={`relative overflow-hidden ${heightClass}`}>
      <StyledImage
        src={imageUrl}
        alt={address}
        variant="professional"
        placeholder={placeholder}
        className="h-full w-full"
      />
      {status && (
        <div className="absolute left-3 top-3 sm:left-4 sm:top-4">
          <BodyText
            as="span"
            className={`rounded-full px-2 py-1 text-xs font-medium sm:px-3 sm:py-1.5 sm:text-sm ${status.className}`}
          >
            {status.text}
          </BodyText>
        </div>
      )}
      {pricePosition !== "below-address" && (
        <div
          className={`absolute top-3 sm:top-4 ${
            pricePosition === "top-left" ? "left-3 sm:left-4" : "right-3 sm:right-4"
          } rounded-full border border-neutral-200/50 bg-neutral-50/95 px-2 py-1 backdrop-blur-sm sm:px-3 sm:py-1.5`}
        >
          <BodyText as="span" className="text-olive text-xs font-medium sm:text-sm">
            {formatPrice(price)}
          </BodyText>
        </div>
      )}
      {(topContent || (showNotInterested && property)) && (
        <div className="pointer-events-none absolute inset-0">
          <div className="pointer-events-auto relative h-full w-full">
            {showNotInterested && property && (
              <CardNotInterested
                property={property}
                size="sm"
                position="top-left"
                onMarkNotInterested={onMarkNotInterested}
              />
            )}
            {topContent}
          </div>
        </div>
      )}
    </div>
  );
}

type PropertyCardBodyProps = {
  hideImage: boolean;
  price: string;
  topContent?: React.ReactNode;
  showNotInterested: boolean;
  property?: SearchResult | Property;
  onMarkNotInterested: () => void;
  isOnMap: boolean;
  pricePosition: "top-left" | "top-right" | "below-address";
  showScore: boolean;
  score?: number;
  address: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lotSize?: string;
  propertyType?: string;
  hideSquareFootage: boolean;
  bottomContent?: React.ReactNode;
  showTrianglePointer: boolean;
};

function PropertyCardBody(props: PropertyCardBodyProps) {
  const addressClassName = props.pricePosition === "below-address" ? "mb-0 w-full" : "mb-1 w-full";
  return (
    <>
      <div className="space-y-2 p-3 sm:space-y-3 sm:p-4">
        {props.hideImage && (
          <PropertyCardHideImageHeader
            price={props.price}
            topContent={props.topContent}
            showNotInterested={props.showNotInterested}
            property={props.property}
            onMarkNotInterested={props.onMarkNotInterested}
          />
        )}
        <PropertyCardPriceRow
          pricePosition={props.pricePosition}
          price={props.price}
          showScore={props.showScore}
          score={props.score}
          isOnMap={props.isOnMap}
          address={props.address}
          addressClassName={addressClassName}
        />
        <PropertyCardDetailsRow
          bedrooms={props.bedrooms}
          bathrooms={props.bathrooms}
          sqft={props.sqft}
          lotSize={props.lotSize}
          propertyType={props.propertyType}
          hideSquareFootage={props.hideSquareFootage}
          isOnMap={props.isOnMap}
        />
        {props.bottomContent && <div>{props.bottomContent}</div>}
      </div>
      {props.showTrianglePointer && <PropertyCardTrianglePointer />}
    </>
  );
}

function PropertyCardReasonView({
  property,
  cardType,
  onSelectReason,
  onUndo,
}: {
  property: SearchResult | Property;
  cardType: "searchpage" | "regular";
  onSelectReason: (why: string) => Promise<void>;
  onUndo: () => Promise<void>;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") e.preventDefault();
      }}
      className="transition-none"
    >
      <WhyNotInterestedCard
        property={property}
        onSelectReason={onSelectReason}
        onUndo={onUndo}
        cardType={cardType}
      />
    </div>
  );
}

function PropertyCardMainContent({
  props,
  setShowReasonCard,
}: {
  props: PropertyCardProps;
  setShowReasonCard: (v: boolean) => void;
}) {
  const {
    imageUrl,
    address,
    price,
    score,
    bedrooms,
    bathrooms,
    sqft,
    lotSize,
    propertyType,
    status,
    cardType = "regular",
    pricePosition = "top-right",
    topContent,
    bottomContent,
    hideSquareFootage = false,
    showTrianglePointer = false,
    isOnMap = false,
    hideImage = false,
    property,
    showNotInterested = false,
    showScore = true,
  } = props;
  const markNotInterested = () => setShowReasonCard(true);
  return (
    <>
      {imageUrl && !hideImage && (
        <PropertyCardImageSection
          imageUrl={imageUrl}
          address={address}
          cardType={cardType}
          status={status}
          pricePosition={pricePosition}
          price={price}
          topContent={topContent}
          showNotInterested={showNotInterested}
          property={property}
          onMarkNotInterested={markNotInterested}
        />
      )}
      <PropertyCardBody
        hideImage={hideImage}
        price={price}
        topContent={topContent}
        showNotInterested={showNotInterested}
        property={property}
        onMarkNotInterested={markNotInterested}
        isOnMap={isOnMap}
        pricePosition={pricePosition}
        showScore={showScore}
        score={score}
        address={address}
        bedrooms={bedrooms}
        bathrooms={bathrooms}
        sqft={sqft}
        lotSize={lotSize}
        propertyType={propertyType}
        hideSquareFootage={hideSquareFootage}
        bottomContent={bottomContent}
        showTrianglePointer={showTrianglePointer}
      />
    </>
  );
}

function PropertyCardMainView({
  props,
  setShowReasonCard,
}: {
  props: PropertyCardProps;
  setShowReasonCard: (v: boolean) => void;
}) {
  const { cardType = "regular", loading = false, onClick, className = "", width } = props;
  return (
    <BaseCard
      hover
      interactive
      loading={loading}
      padding="none"
      cardType={cardType}
      width={width}
      className={className}
      onClick={onClick}
    >
      <PropertyCardMainContent props={props} setShowReasonCard={setShowReasonCard} />
    </BaseCard>
  );
}

function PropertyCardImpl(props: PropertyCardProps) {
  const {
    id,
    address,
    price,
    score,
    property,
    onSelectNotInterestedReason,
    onUndoNotInterested,
    cardType = "regular",
  } = props;
  const [showReasonCard, setShowReasonCard] = useState(false);

  if (getEnv().isDevelopment) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useWhyRender({ id, address, price, score });
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const mounted = React.useRef(false);
    if (!mounted.current) mounted.current = true;
  }

  const handleSelectReason = async (why: string) => {
    if (!onSelectNotInterestedReason) return;
    try {
      await onSelectNotInterestedReason(why);
      setShowReasonCard(false);
    } catch (error) {
      log.error(LOG_CATEGORIES.ERRORS, "Failed to update reason", error);
      throw error;
    }
  };

  const handleUndo = async () => {
    if (!onUndoNotInterested) return;
    try {
      await onUndoNotInterested();
      setShowReasonCard(false);
    } catch (error) {
      log.error(LOG_CATEGORIES.ERRORS, "Failed to undo", error);
      throw error;
    }
  };

  const showReasonView =
    showReasonCard && property && onSelectNotInterestedReason && onUndoNotInterested;

  if (showReasonView && property) {
    return (
      <PropertyCardReasonView
        property={property}
        cardType={cardType}
        onSelectReason={handleSelectReason}
        onUndo={handleUndo}
      />
    );
  }
  return <PropertyCardMainView props={props} setShowReasonCard={setShowReasonCard} />;
}

export const PropertyCard = PropertyCardImpl;
export default PropertyCard;
