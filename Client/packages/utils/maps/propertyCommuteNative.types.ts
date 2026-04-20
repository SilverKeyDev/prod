export type NativeRouteOverlay = {
  key: string;
  coordinates: { latitude: number; longitude: number }[];
  color: string;
};

export type NativeDestinationMarker = {
  key: string;
  latitude: number;
  longitude: number;
  title: string;
};

export type IsochronePolygonsNative = {
  main: { latitude: number; longitude: number }[] | null;
  individuals: { latitude: number; longitude: number }[][];
};
