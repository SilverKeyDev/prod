import type { SearchResult } from "packages/types";
import { isListingFullCriteriaMatch } from "packages/utils/search/scoring/propertyMatchScore";

import type { PropertyCardProps } from "./PropertyCard.types";

export function propertyCardShowsPerfectCriteriaMatch(props: PropertyCardProps): boolean {
  const fromListing =
    props.property &&
    typeof props.property === "object" &&
    "_score" in props.property &&
    typeof (props.property as SearchResult)._score === "number"
      ? (props.property as SearchResult)._score
      : undefined;
  return isListingFullCriteriaMatch({ _score: fromListing ?? props.score });
}

export function formatPropertyCardPrice(price: string | number): string {
  if (typeof price === "number") {
    return `$${price.toLocaleString()}`;
  }
  const priceStr = price.toString();
  return priceStr.startsWith("$") ? priceStr : `$${priceStr}`;
}
