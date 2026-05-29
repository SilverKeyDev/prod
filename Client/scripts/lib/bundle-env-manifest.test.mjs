import { describe, expect, it } from "vitest";

import {
  assertGithubSecretsPresent,
  validateBundleEnvValue,
  verifyBundleEnvFromBuild,
} from "./bundle-env-manifest.mjs";

describe("validateBundleEnvValue", () => {
  it("rejects empty values for required keys", () => {
    expect(validateBundleEnvValue("", { key: "EXPO_PUBLIC_GOOGLE_MAPS_ID", minLength: 8 })).toMatch(
      /missing/
    );
  });

  it("rejects Map ID that looks like a JS API key", () => {
    expect(
      validateBundleEnvValue("AIzaSyAbcdefghijklmnop", {
        key: "EXPO_PUBLIC_GOOGLE_MAPS_ID",
        forbidPrefix: "AIza",
      })
    ).toMatch(/AIza/);
  });

  it("accepts a plausible map id", () => {
    expect(
      validateBundleEnvValue("20e2eb0b8f03975aaf072074", {
        key: "EXPO_PUBLIC_GOOGLE_MAPS_ID",
        minLength: 8,
        forbidPrefix: "AIza",
      })
    ).toBeNull();
  });
});

describe("assertGithubSecretsPresent", () => {
  it("fails when required secret env is empty", () => {
    const manifest = {
      version: 1,
      variables: [
        {
          key: "EXPO_PUBLIC_GOOGLE_MAPS_ID",
          required: true,
          githubSecret: "EXPO_PUBLIC_GOOGLE_MAPS_ID",
        },
      ],
    };
    const { ok, errors } = assertGithubSecretsPresent({}, manifest);
    expect(ok).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("passes when required secret is set", () => {
    const manifest = {
      version: 1,
      variables: [
        {
          key: "EXPO_PUBLIC_GOOGLE_MAPS_ID",
          required: true,
          githubSecret: "EXPO_PUBLIC_GOOGLE_MAPS_ID",
        },
      ],
    };
    const { ok } = assertGithubSecretsPresent(
      { EXPO_PUBLIC_GOOGLE_MAPS_ID: "20e2eb0b8f03975aaf072074" },
      manifest
    );
    expect(ok).toBe(true);
  });
});

describe("verifyBundleEnvFromBuild", () => {
  it("fails when shim is missing", () => {
    const manifest = {
      version: 1,
      variables: [{ key: "EXPO_PUBLIC_GOOGLE_MAPS_ID", required: true, minLength: 8 }],
    };
    const { ok, errors } = verifyBundleEnvFromBuild("/nonexistent-client-root", manifest);
    expect(ok).toBe(false);
    expect(errors.some((e) => e.includes("process-shim"))).toBe(true);
  });
});
