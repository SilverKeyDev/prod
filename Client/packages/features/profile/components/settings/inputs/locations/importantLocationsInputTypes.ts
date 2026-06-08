/// <reference types="google.maps" />

export type ImportantLocation = {
  address: string;
  commute_tolerance?: number;
};

export interface GooglePlacePrediction {
  text: {
    text: string;
  };
  toPlace: () => google.maps.places.Place;
}

export type Suggestion = {
  placePrediction: GooglePlacePrediction;
  description: string;
};

export type ImportantLocationsInputProps = {
  locations: ImportantLocation[];
  onChange: (locations: ImportantLocation[]) => void;
  /** Web Maps autocomplete; omitted on native manual entry. */
  scriptsReady?: boolean;
  isEditMode?: boolean;
  addButtonLabel?: string;
};
