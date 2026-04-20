/// <reference types="google.maps" />
import { buildIsochroneOverlayFromViewportRing } from "packages/features/search/utils/map/locationBoundsOverlay";

import type { Suggestion } from "./searchLocationBarTypes";

export type SearchLocationBarMapDeps = {
  fitMapToBounds: (bounds: google.maps.LatLngBounds) => void;
  setSearchAnchor: (p: { lat: number; lng: number }) => void;
  setLocationPlaceViewportFromBar: (p: {
    ring: Array<{ lat: number; lng: number }>;
    label: string;
    overlay: ReturnType<typeof buildIsochroneOverlayFromViewportRing>;
  }) => void;
  setLocalValue: (v: string) => void;
  setHasSelected: (v: boolean) => void;
  setSuggestions: (v: Suggestion[]) => void;
  setIsFocused: (v: boolean) => void;
  onSearch: () => void | Promise<void>;
};
