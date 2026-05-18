import { describe, expect, it } from "vitest";

import { ADMIN_TRANSLATIONS } from "./translations";

describe("ADMIN_TRANSLATIONS", () => {
  it("has non-empty string values for every key", () => {
    for (const [key, value] of Object.entries(ADMIN_TRANSLATIONS)) {
      expect(key.startsWith("admin."), `key should be admin-scoped: ${key}`).toBe(true);
      expect(typeof value, key).toBe("string");
      expect(value.trim().length, key).toBeGreaterThan(0);
    }
  });

  it("includes dev persona keys used by admin UI", () => {
    expect(ADMIN_TRANSLATIONS["admin.dev_persona.title"]).toBeDefined();
    expect(ADMIN_TRANSLATIONS["admin.dev_persona.persona_agent"]).toBeDefined();
    expect(ADMIN_TRANSLATIONS["admin.dev_persona.banner_prefix"]).toBeDefined();
    expect(ADMIN_TRANSLATIONS["admin.dev_reset.title"]).toBeDefined();
    expect(ADMIN_TRANSLATIONS["admin.dev_reset.scope_preferences"]).toBeDefined();
  });
});
