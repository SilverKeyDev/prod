import fs from "fs";
import os from "os";
import path from "path";

import { describe, expect, it } from "vitest";

import {
  assertBundleSecretsPresent,
  assertBundleSecretsPresentWithValidation,
  formatDockerBuildArgs,
  formatDockerBuildSecrets,
  formatEnvFileDockerBuildArgs,
  parseDotenvFile,
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

describe("assertBundleSecretsPresent", () => {
  it("fails when required bundle env is empty", () => {
    const manifest = {
      version: 1,
      variables: [
        {
          key: "EXPO_PUBLIC_GOOGLE_MAPS_ID",
          required: true,
        },
      ],
    };
    const { ok, errors } = assertBundleSecretsPresent({}, manifest);
    expect(ok).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("passes when required bundle env is set", () => {
    const manifest = {
      version: 1,
      variables: [
        {
          key: "EXPO_PUBLIC_GOOGLE_MAPS_ID",
          required: true,
        },
      ],
    };
    const { ok } = assertBundleSecretsPresent(
      { EXPO_PUBLIC_GOOGLE_MAPS_ID: "20e2eb0b8f03975aaf072074" },
      manifest
    );
    expect(ok).toBe(true);
  });
});

describe("assertBundleSecretsPresentWithValidation", () => {
  it("rejects bad PostHog key missing phc_ prefix", () => {
    const manifest = {
      version: 1,
      variables: [
        {
          key: "EXPO_PUBLIC_POSTHOG_KEY",
          required: true,
          pattern: "^phc_",
          minLength: 10,
        },
      ],
    };
    const { ok, errors } = assertBundleSecretsPresentWithValidation(
      { EXPO_PUBLIC_POSTHOG_KEY: "not-a-posthog-key" },
      manifest
    );
    expect(ok).toBe(false);
    expect(errors.some((e) => e.includes("EXPO_PUBLIC_POSTHOG_KEY"))).toBe(true);
  });
});

describe("parseDotenvFile", () => {
  it("parses entries and skips comments and blanks", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dotenv-"));
    const file = path.join(dir, ".env");
    fs.writeFileSync(file, "# comment\nA=1\nB='quoted'\n\nC=\"double\"\n");
    expect(parseDotenvFile(file)).toEqual({ A: "1", B: "quoted", C: "double" });
  });
});

describe("formatEnvFileDockerBuildArgs", () => {
  it("emits --build-arg for every env entry", () => {
    const args = formatEnvFileDockerBuildArgs({
      EXPO_PUBLIC_POSTHOG_KEY: "phc_test",
      EXPO_PUBLIC_API_URL: "http://localhost:5000",
    });
    expect(args).toEqual([
      "--build-arg EXPO_PUBLIC_POSTHOG_KEY='phc_test'",
      "--build-arg EXPO_PUBLIC_API_URL='http://localhost:5000'",
    ]);
  });
});

describe("formatDockerBuildArgs", () => {
  it("emits --build-arg for dockerBuildArg entries", () => {
    const manifest = {
      version: 1,
      variables: [
        { key: "EXPO_PUBLIC_GOOGLE_MAPS_ID", dockerBuildArg: true },
        { key: "EXPO_PUBLIC_PLAID_CLIENT_ID", dockerBuildArg: false },
      ],
    };
    const args = formatDockerBuildArgs(
      { EXPO_PUBLIC_GOOGLE_MAPS_ID: "map-id-123", EXPO_PUBLIC_PLAID_CLIENT_ID: "ignored" },
      manifest
    );
    expect(args).toEqual(["--build-arg EXPO_PUBLIC_GOOGLE_MAPS_ID='map-id-123'"]);
  });
});

describe("formatDockerBuildSecrets", () => {
  it("emits --secret for dockerBuildArg entries with values", () => {
    const manifest = {
      version: 1,
      variables: [
        { key: "EXPO_PUBLIC_GOOGLE_MAPS_ID", dockerBuildArg: true },
        { key: "EXPO_PUBLIC_POSTHOG_KEY", dockerBuildArg: true },
        { key: "EXPO_PUBLIC_PLAID_CLIENT_ID", dockerBuildArg: false },
      ],
    };
    const args = formatDockerBuildSecrets(
      {
        EXPO_PUBLIC_GOOGLE_MAPS_ID: "map-id-123",
        EXPO_PUBLIC_POSTHOG_KEY: "phc_test",
        EXPO_PUBLIC_PLAID_CLIENT_ID: "ignored",
      },
      manifest
    );
    expect(args).toEqual([
      "--secret id=EXPO_PUBLIC_GOOGLE_MAPS_ID,env=EXPO_PUBLIC_GOOGLE_MAPS_ID",
      "--secret id=EXPO_PUBLIC_POSTHOG_KEY,env=EXPO_PUBLIC_POSTHOG_KEY",
    ]);
  });

  it("skips empty secret env values", () => {
    const manifest = {
      version: 1,
      variables: [{ key: "EXPO_PUBLIC_POSTHOG_KEY", dockerBuildArg: true }],
    };
    const args = formatDockerBuildSecrets({ EXPO_PUBLIC_POSTHOG_KEY: "  " }, manifest);
    expect(args).toEqual([]);
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
