import { describe, expect, it } from "vitest";

import { decodeGoogleEncodedPolyline } from "./decodeGoogleEncodedPolyline";

describe("decodeGoogleEncodedPolyline", () => {
  it("decodes a short known polyline", () => {
    // Example from Google polyline algorithm docs (simplified path)
    const path = decodeGoogleEncodedPolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
    expect(path.length).toBeGreaterThan(1);
    expect(path[0]).toMatchObject({
      latitude: expect.any(Number),
      longitude: expect.any(Number),
    });
    expect(Number.isFinite(path[0].latitude)).toBe(true);
    expect(Number.isFinite(path[0].longitude)).toBe(true);
  });

  it("returns empty array for empty string", () => {
    expect(decodeGoogleEncodedPolyline("")).toEqual([]);
  });
});
