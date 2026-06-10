import React from "react";

import type { Property, SearchResult } from "packages/types";
import { Box } from "packages/ui/components/structure/primitives";

import {
  PropertyCardDetailsRow,
  PropertyCardHideImageHeader,
  PropertyCardPriceRow,
  PropertyCardTrianglePointer,
} from "./PropertyCardBodySection";

type PropertyCardContentBodyProps = {
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

export function PropertyCardContentBody(props: PropertyCardContentBodyProps) {
  const addressClassName = props.pricePosition === "below-address" ? "mb-0 w-full" : "mb-1 w-full";
  return (
    <>
      <Box className="space-y-2 p-3 sm:space-y-3 sm:p-4">
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
        {props.bottomContent && <Box>{props.bottomContent}</Box>}
      </Box>
      {props.showTrianglePointer && <PropertyCardTrianglePointer />}
    </>
  );
}
