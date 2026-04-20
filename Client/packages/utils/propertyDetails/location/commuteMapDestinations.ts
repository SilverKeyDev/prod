export type CommuteTravelTimeRow = {
  location_name?: string;
  name?: string;
  label?: string;
  location_address?: string;
  address?: string;
  encoded_polyline?: string | null;
};

export type CommuteMapDestination = {
  address: string;
  label: string;
  /** Present when server returned a Directions overview polyline for this leg. */
  encodedPolyline?: string;
};

/** Rows from commute_data.travel_times with valid addresses for map markers / directions. */
export function commuteDestinationsForMap(
  travelTimes: CommuteTravelTimeRow[]
): CommuteMapDestination[] {
  return travelTimes
    .map((tt) => {
      const address = String(tt.location_address ?? tt.address ?? "").trim();
      if (!address) return null;
      const label = String(
        tt.location_name ??
          tt.label ??
          tt.name ??
          tt.location_address ??
          tt.address ??
          "Destination"
      );
      const enc = tt.encoded_polyline;
      const out: CommuteMapDestination = { address, label };
      if (typeof enc === "string" && enc.length > 0) {
        out.encodedPolyline = enc;
      }
      return out;
    })
    .filter((x): x is CommuteMapDestination => x != null);
}
