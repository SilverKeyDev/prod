import type { ViewingStop } from "packages/api/viewings";

export type { ViewingItinerary, ViewingStop } from "packages/api/viewings";

export type ViewingStopListProps = {
  stops: ViewingStop[];
  onStopsChange: (next: ViewingStop[]) => void;
  /** Web AddressInput: set when Maps/Places scripts are ready */
  scriptsReady?: boolean;
  loadError?: string | null;
};
