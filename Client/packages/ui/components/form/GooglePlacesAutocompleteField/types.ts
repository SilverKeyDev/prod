/// <reference types="google.maps" />

export interface GooglePlacePrediction {
  text: {
    text: string;
  };
  toPlace: () => google.maps.places.Place;
}

export type GooglePlacesSuggestion = {
  placePrediction: GooglePlacePrediction;
  description: string;
};
