import type { components } from "packages/types/api.generated";
import type { PropertyHighlightsContext } from "packages/types/domain/propertyHighlightsContext";
import type { SavedHome } from "packages/types/domain/savedHome";

import type { SearchResult } from "./result";

/** Wire row shape for saved-home API payloads in search UI. */
export type SavedHomeWireRow = {
  address: string;
  price?: number;
  beds?: string;
  baths?: string;
  sqft?: string;
  lot_size?: number;
  property_type?: string;
  listing_status?: string;
  image_url?: string;
  lat?: number;
  lng?: number;
};

// Re-export from generated schema
export type PropertySearchResult = components["schemas"]["PropertySearchResult"];

/** Re-export for consumers that import SavedHome from search types/property */
export type { SavedHome } from "packages/types/domain/savedHome";

/** Alias for map/card code that accepts SearchResult | SavedHome */
export type Property = SavedHome;

export type { PropertyHighlightsContext } from "packages/types/domain/propertyHighlightsContext";

/** Single strength line from property analysis (legacy payloads may be plain strings). */
export type PropertyProItem = { text: string; score?: number };

/** Single tradeoff line; severity distinguishes major red flags vs moderate warnings. */
export type PropertyConItem = {
  text: string;
  severity?: "red_flag" | "warning";
  score?: number;
};

/** Property analysis from research/offer API (pros, cons, dynamic sections) */
export type PropertyAnalysis = {
  pros?: Array<string | PropertyProItem>;
  cons?: Array<string | PropertyConItem>;
  highlights_context?: PropertyHighlightsContext;
  [key: string]: unknown;
};

/** SearchResult with optional property_analysis (from research/offer flow) */
export type PropertyWithAnalysis = SearchResult & {
  property_analysis?: PropertyAnalysis;
};
