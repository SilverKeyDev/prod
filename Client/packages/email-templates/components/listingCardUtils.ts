/**
 * Pure helpers for ListingCard (email) to reduce complexity and branching in the main component.
 */

export type ListingForUtils = {
  price: string;
  isNewListing?: boolean;
  priceCut?: {
    amount: string;
    percent?: number;
  };
};

export function formatPrice(price: string | number): string {
  if (typeof price === "number") {
    return `$${price.toLocaleString()}`;
  }
  const priceStr = price.toString().replace(/,/g, "").replace("$", "");
  const priceNum = parseInt(priceStr, 10);
  if (isNaN(priceNum)) return price.toString();
  return `$${priceNum.toLocaleString()}`;
}

export function formatSqft(sqft?: number): string {
  if (!sqft || sqft <= 0) return "n/a sqft";
  return `${Math.round(sqft).toLocaleString()} sqft`;
}

/** Single place for highlight box copy to avoid nested ternaries in JSX. */
export function getListingHighlightMessage(listing: ListingForUtils): string {
  if (listing.isNewListing && listing.priceCut) {
    return "✨ Brand new listing with a recent price reduction!";
  }
  if (listing.isNewListing) {
    return "✨ This is a brand new listing - be among the first to view it!";
  }
  if (listing.priceCut) {
    const pct = listing.priceCut.percent ? ` (${listing.priceCut.percent}% off)` : "";
    return `🔻 Price reduced by ${listing.priceCut.amount}${pct} - Great opportunity!`;
  }
  return "";
}
