import { describe, expect, it } from "vitest";

import { POSTHOG_API_HOST, POSTHOG_APP_URL } from "./posthogConstants";

describe("posthogConstants", () => {
  it("uses US cloud API host (not localhost)", () => {
    expect(POSTHOG_API_HOST).toBe("https://us.i.posthog.com");
    expect(POSTHOG_API_HOST).not.toMatch(/localhost|127\.0\.0\.1/i);
  });

  it("uses US cloud app URL (not localhost)", () => {
    expect(POSTHOG_APP_URL).toBe("https://us.posthog.com");
    expect(POSTHOG_APP_URL).not.toMatch(/localhost|127\.0\.0\.1/i);
  });
});
