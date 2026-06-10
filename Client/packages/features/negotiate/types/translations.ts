/** Negotiate feature translation strings (negotiation, negotiate). */
import { ACTION_LABELS } from "packages/utils/product/domain/actionLabels";

export const NEGOTIATE_TRANSLATIONS: Record<string, string> = {
  "negotiation.title": "Negotiate",
  "negotiation.send": ACTION_LABELS.SEND,
  "negotiate.home_selector.placeholder": "Select a home...",
  "negotiate.home_selector.generate": "Generate",
  "negotiate.strategy.share": ACTION_LABELS.SHARE,
  "negotiate.loading.analyzing": "Analyzing property and market data...",
  "negotiate.loading.description":
    "Our AI is reviewing recent sales, market trends, and property details to craft your negotiation strategy.",
  "negotiate.loading.finding_comparables": "Finding Comparable Properties",
  "negotiate.comparables_title": "Comparable Properties",
  "negotiate.comparables_empty": "No comparable properties found",
  "negotiate.error_generating_strategy": "Error generating strategy",
  "negotiate.strategy_field.yes": "Yes",
  "negotiate.strategy_field.no": "No",
  "negotiate.opening_offer.recommended": "Recommended Opening Offer",
  "negotiate.debug.section_title": "Property Comparables (Debug)",
};
