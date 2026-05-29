import { describe, expect, it, vi } from "vitest";

import { applyStreamUpdate, parseStreamError } from "./propertyDetailsStreamHelpers";
import type { Property } from "./propertyDetailsTypes";

function apply(
  update: { type: string; data: unknown },
  initial: Property | null = { address: "123 Main", id: "1" } as Property
) {
  let state: Property | null = initial;
  const setSelectedProperty = vi.fn(
    (value: Property | null | ((prev: Property | null) => Property | null)) => {
      state = typeof value === "function" ? value(state) : value;
    }
  );
  const setIsLoading = vi.fn();
  applyStreamUpdate(update, setSelectedProperty, setIsLoading);
  return { state, setIsLoading };
}

describe("parseStreamError", () => {
  it("uses details, message, or error in order", () => {
    expect(parseStreamError({ message: "Bad request" })).toBe("Bad request");
    expect(parseStreamError({ error: "fail" })).toBe("fail");
  });

  it("parses JSON details and appends status code", () => {
    expect(
      parseStreamError({
        details: JSON.stringify({ message: "Not found" }),
        status_code: 404,
      })
    ).toBe("Not found (404)");
  });

  it("falls back to raw details when JSON parse fails", () => {
    expect(parseStreamError({ details: "plain error" })).toBe("plain error");
  });
});

describe("applyStreamUpdate", () => {
  it("ignores updates without type", () => {
    const { state, setIsLoading } = apply({ type: "", data: {} });
    expect(state).toEqual({ address: "123 Main", id: "1" });
    expect(setIsLoading).not.toHaveBeenCalled();
  });

  it("merges basic data into existing property", () => {
    const { state } = apply({
      type: "basic",
      data: { data: { price: "$500,000", bedrooms: 3 } },
    });
    expect(state).toMatchObject({
      address: "123 Main",
      price: "$500,000",
      bedrooms: 3,
    });
  });

  it("sets commute_data", () => {
    const commute = { travel_times: [{ minutes: 20 }] };
    const { state } = apply({ type: "commute_data", data: commute });
    expect(state).toMatchObject({ commute_data: commute });
  });

  it("merges property_analysis_section into property_analysis", () => {
    const { state } = apply({
      type: "property_analysis_section",
      data: { neighborhood: { summary: "Quiet area" } },
    });
    expect(state?.property_analysis).toMatchObject({
      neighborhood: { summary: "Quiet area" },
    });
  });

  it("merges property_analysis and property_analysis_partial", () => {
    const partial = apply({
      type: "property_analysis_partial",
      data: { pros: ["Great schools"] },
    });
    const full = apply(
      {
        type: "property_analysis",
        data: { cons: ["Small lot"] },
      },
      partial.state
    );
    expect(full.state?.property_analysis).toMatchObject({
      pros: ["Great schools"],
      cons: ["Small lot"],
    });
  });

  it("assigns images from array or wrapped object", () => {
    const fromArray = apply({ type: "images", data: ["a.jpg", "b.jpg"] });
    expect(fromArray.state?.images).toEqual(["a.jpg", "b.jpg"]);

    const fromWrapper = apply({
      type: "images",
      data: { images: ["c.jpg"] },
    });
    expect(fromWrapper.state?.images).toEqual(["c.jpg"]);
  });

  it("assigns image_features, features, and combined_features", () => {
    const features = apply({ type: "features", data: { kitchen: ["granite"] } });
    expect(features.state?.features).toEqual({ kitchen: ["granite"] });

    const imageFeatures = apply({ type: "image_features", data: { clean: ["pool"] } });
    expect(imageFeatures.state?.image_features).toEqual({ clean: ["pool"] });

    const combined = apply({ type: "combined_features", data: ["a", "b"] });
    expect(combined.state?.combined_features).toEqual(["a", "b"]);
  });

  it("sets loading false on complete", () => {
    const { setIsLoading } = apply({ type: "complete", data: null });
    expect(setIsLoading).toHaveBeenCalledWith(false);
  });

  it("does not mutate when prev property is null", () => {
    let state: Property | null = null;
    const setSelectedProperty = vi.fn(
      (value: Property | null | ((prev: Property | null) => Property | null)) => {
        state = typeof value === "function" ? value(state) : value;
      }
    );
    applyStreamUpdate(
      { type: "basic", data: { data: { price: "$1" } } },
      setSelectedProperty,
      vi.fn()
    );
    expect(state).toBeNull();
  });
});
