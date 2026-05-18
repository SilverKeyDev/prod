import { describe, expect, it } from "vitest";

import { resolveClientAvatarUrl } from "./resolveClientAvatarUrl";

describe("resolveClientAvatarUrl", () => {
  it("prefers presigned profile_picture_url", () => {
    expect(
      resolveClientAvatarUrl(
        { profile_picture_url: "https://cdn.example/a.jpg" },
        { client_profile_picture: "profiles/key.jpg" }
      )
    ).toBe("https://cdn.example/a.jpg");
  });

  it("uses conversation URL when it is http(s)", () => {
    expect(
      resolveClientAvatarUrl(
        { profile_picture_url: null },
        { client_profile_picture: "https://cdn.example/b.jpg" }
      )
    ).toBe("https://cdn.example/b.jpg");
  });

  it("ignores raw S3 keys", () => {
    expect(
      resolveClientAvatarUrl(
        { profile_picture_url: "profiles/user.jpg" },
        { client_profile_picture: "profiles/conv.jpg" }
      )
    ).toBeNull();
  });
});
