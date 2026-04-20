import React from "react";

import type { PropertyCardProps } from "./PropertyCard.types";
import { PropertyCardContentBody } from "./PropertyCardContentBody";
import { PropertyCardImageSection } from "./PropertyCardImageSection";

type PropertyCardMainContentProps = {
  props: PropertyCardProps;
  setShowReasonCard: (v: boolean) => void;
};

export function PropertyCardMainContent({
  props,
  setShowReasonCard,
}: PropertyCardMainContentProps) {
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
      <PropertyCardContentBody
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
