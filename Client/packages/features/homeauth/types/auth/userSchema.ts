/**
 * Zod schemas for user API boundaries (runtime validation).
 * Use .safeParse() at the boundary and throw or normalize on failure.
 */
import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  /** Present for Cognito users; null for Google-only accounts (matches API). */
  cognito_id: z.string().nullable().optional(),
  email: z.string(),
  name: z.string(),
  /** DB column is nullable; Flask may serialize as null. */
  phone: z.string().nullable().optional(),
  /** `to_dict` uses isoformat or None when unset. */
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  is_active: z.boolean(),
  is_agent: z.boolean().optional(),
  /** Not persisted on users row; may be absent on profile responses. */
  is_closing_mode: z.boolean().optional(),
  google_id: z.string().nullable().optional(),
  /** Stored as Text in DB - API returns a string (or null), not a JSON array. */
  client_ids: z
    .union([z.array(z.string()), z.string()])
    .nullable()
    .optional(),
  agent_id: z
    .union([z.array(z.string()), z.string()])
    .nullable()
    .optional(),
  mls_id: z.string().nullable().optional(),
  brokerage: z.string().nullable().optional(),
  preferences_version: z.string().nullable().optional(),
  roles: z.array(z.string()).optional(),
  has_subscription: z.boolean().optional(),
  subscription: z.unknown().optional(),
  has_preferences: z.boolean().optional(),
  profile_picture: z.string().nullable().optional(),
  profile_picture_url: z.string().nullable().optional(),
});

export const userResponseSchema = z.object({
  success: z.boolean(),
  user: userSchema.optional(),
  data: userSchema.optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type UserResponseValidated = z.infer<typeof userResponseSchema>;
