import { describe, expect, it } from "vitest";

import { userResponseSchema } from "./userSchema";

describe("userResponseSchema", () => {
  it("accepts profile payload from User.to_dict (cognito_id null)", () => {
    const raw = {
      success: true,
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        cognito_id: null,
        email: "a@example.com",
        name: "Test User",
        created_at: "2024-01-01T00:00:00",
        is_active: true,
        has_preferences: false,
        is_agent: false,
      },
    };
    const parsed = userResponseSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.data?.cognito_id).toBeNull();
      expect(parsed.data.data?.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    }
  });

  it("accepts cognito_id omitted", () => {
    const raw = {
      success: true,
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "b@example.com",
        name: "Other",
        created_at: "2024-01-01T00:00:00",
        is_active: true,
      },
    };
    expect(userResponseSchema.safeParse(raw).success).toBe(true);
  });

  it("accepts Flask-null booleans (admin profile / nullable DB columns)", () => {
    const raw = {
      success: true,
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "admin@example.com",
        name: "Admin",
        is_active: null,
        is_agent: null,
        has_preferences: null,
      },
    };
    const parsed = userResponseSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success && parsed.data.data) {
      expect(parsed.data.data.is_active).toBe(false);
      expect(parsed.data.data.is_agent).toBe(false);
      expect(parsed.data.data.has_preferences).toBe(false);
    }
  });
});
