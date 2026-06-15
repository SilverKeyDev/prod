import { getWindow } from "packages/utils/core/platform";

export type DeviceLocationResult =
  | { status: "granted"; lat: number; lng: number }
  | { status: "denied" }
  | { status: "unavailable" };

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 30_000,
  timeout: 10_000,
};

/** Request one-shot device location for search area resolution (web). */
export function requestDeviceLocationForSearch(): Promise<DeviceLocationResult> {
  const w = getWindow();
  const geo = w?.navigator?.geolocation;
  if (!geo) {
    return Promise.resolve({ status: "unavailable" });
  }

  return new Promise((resolve) => {
    geo.getCurrentPosition(
      (pos) => {
        resolve({
          status: "granted",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        resolve({ status: "denied" });
      },
      GEO_OPTIONS
    );
  });
}
