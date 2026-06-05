import { color } from "packages/design-tokens";
import { log } from "packages/logger";
import { getWindow } from "packages/utils/core/platform";

export const COMMUTE_ROUTE_COLORS = [
  color("olive.DEFAULT"),
  color("brown.DEFAULT"),
  color("gold.DEFAULT"),
  color("blue.DEFAULT"),
  color("navy"),
];

export function geocodeToLatLng(
  geocoder: google.maps.Geocoder,
  address: string
): Promise<google.maps.LatLngLiteral | null> {
  return new Promise((resolve) => {
    void geocoder.geocode({ address }, (results, status) => {
      if (status !== "OK" || !results?.[0]?.geometry?.location) {
        resolve(null);
        return;
      }
      const loc = results[0].geometry.location;
      resolve({ lat: loc.lat(), lng: loc.lng() });
    });
  });
}

// JS `Route.computeRoutes` uses LatLngLiteral at top level — not REST `{ location: { latLng } }`.
interface RoutesAPI {
  Route: {
    computeRoutes(request: {
      origin: google.maps.LatLngLiteral | string;
      destination: google.maps.LatLngLiteral | string;
      travelMode: string;
      computeAlternativeRoutes?: boolean;
      routeModifiers?: {
        avoidTolls?: boolean;
        avoidHighways?: boolean;
        avoidFerries?: boolean;
      };
      fields?: string[];
    }): Promise<{
      routes: Array<{
        polyline: {
          encodedPolyline: string;
        };
      }>;
    }>;
  };
}

export async function fetchDrivingPath(
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral
): Promise<google.maps.LatLng[] | null> {
  const win = getWindow() as
    | (Window & {
        google?: typeof google & {
          maps: typeof google.maps & { routes?: RoutesAPI };
        };
      })
    | null;

  if (win?.google?.maps?.routes?.Route?.computeRoutes) {
    try {
      const request = {
        origin,
        destination,
        travelMode: "DRIVING",
        computeAlternativeRoutes: false,
        routeModifiers: {
          avoidTolls: false,
          avoidHighways: false,
          avoidFerries: false,
        },
        fields: ["path"],
      };

      const response = await win.google.maps.routes.Route.computeRoutes(request);

      if (!response?.routes?.[0]) {
        return null;
      }

      const route = response.routes[0];
      const polyline = route.polyline;

      if (!polyline?.encodedPolyline) {
        return null;
      }

      if (!win.google?.maps?.geometry?.encoding?.decodePath) {
        log.warn("PROPERTY_DETAILS", "Geometry library not available for polyline decoding");
        return null;
      }

      const path = win.google.maps.geometry.encoding.decodePath(polyline.encodedPolyline);
      return path;
    } catch (error) {
      log.error(
        "PROPERTY_DETAILS",
        "Failed to compute route with Routes API - ensure 'routes' library is loaded",
        { error, hasRoutesAPI: !!win?.google?.maps?.routes }
      );
    }
  }

  log.warn("PROPERTY_DETAILS", "Routes API not available, using DirectionsService (deprecated)");

  if (!win?.google?.maps?.DirectionsService) {
    return null;
  }

  return new Promise((resolve) => {
    const ds = new win.google.maps.DirectionsService();
    void ds.route(
      {
        origin,
        destination,
        travelMode: win.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status !== win.google.maps.DirectionsStatus.OK || !result?.routes[0]) {
          resolve(null);
          return;
        }
        const path = result.routes[0].overview_path ?? [];
        resolve(path);
      }
    );
  });
}
