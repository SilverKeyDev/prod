import type { DeviceLocationResult } from "./requestDeviceLocationForSearch";

/** Native: no expo-location yet; resolver falls back to map region or default market. */
export function requestDeviceLocationForSearch(): Promise<DeviceLocationResult> {
  return Promise.resolve({ status: "unavailable" });
}
