import { describe, expect, it } from "vitest";

import { DEFAULT_AUTHENTICATED_PATH, ROUTES } from "packages/navigation/types/routes";

import { getPostAuthDestination } from "./postAuthDestination";

describe("getPostAuthDestination", () => {
  it("always routes signup to onboarding", () => {
    expect(getPostAuthDestination({ flow: "signup" })).toBe(ROUTES.ONBOARDING);
    expect(getPostAuthDestination({ flow: "signup", returnPath: "/dashboard" })).toBe(
      ROUTES.ONBOARDING
    );
  });

  it("routes login to a valid return path when provided", () => {
    expect(getPostAuthDestination({ flow: "login", returnPath: "/search" })).toBe("/search");
    expect(getPostAuthDestination({ flow: "login", returnPath: "/profile/settings" })).toBe(
      "/profile/settings"
    );
  });

  it("falls back to the default authenticated path for login without a return path", () => {
    expect(getPostAuthDestination({ flow: "login" })).toBe(DEFAULT_AUTHENTICATED_PATH);
    expect(getPostAuthDestination({ flow: "login", returnPath: "/login" })).toBe(
      DEFAULT_AUTHENTICATED_PATH
    );
    expect(getPostAuthDestination({ flow: "login", returnPath: "dashboard" })).toBe(
      DEFAULT_AUTHENTICATED_PATH
    );
  });
});
