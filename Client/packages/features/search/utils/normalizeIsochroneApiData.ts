import type { IsochroneResponse } from "packages/features/search/api/search";
import type { IsochroneData } from "packages/features/search/types/isochrone";

/** Map GET /isochrone `center.lon` to IsochroneData `center.lng`. */
export function normalizeIsochroneApiData(
  raw: NonNullable<IsochroneResponse["data"]>,
): IsochroneData {
  return {
    ...raw,
    center: {
      lat: raw.center.lat,
      lng: raw.center.lon,
    },
  } as IsochroneData;
}
