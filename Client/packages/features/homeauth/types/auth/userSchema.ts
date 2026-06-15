/**
 * Zod schemas for user API boundaries (runtime validation).
 * Use .safeParse() at the boundary and throw or normalize on failure.
 */
import { z } from "zod";

/** Flask / JSON often sends null for unset booleans; Zod `.optional()` does not accept null. */
const jsonBoolean = (defaultValue: boolean) =>
  z.union([z.boolean(), z.null()]).transform((v): boolean => (v === null ? defaultValue : v));

const jsonBooleanOptional = () =>
  z
    .union([z.boolean(), z.null()])
    .optional()
    .transform((v): boolean => v === true);

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
  is_active: jsonBoolean(false),
  google_id: z.string().nullable().optional(),
  mls_id: z.string().nullable().optional(),
  brokerage: z.string().nullable().optional(),
  preferences_version: z.string().nullable().optional(),
  roles: z.array(z.string()).optional().default([]),
  has_preferences: jsonBooleanOptional(),
  profile_picture: z.string().nullable().optional(),
  profile_picture_url: z.string().nullable().optional(),
  brokerage_org_ids: z.array(z.string()).nullable().optional(),
});

export const userResponseSchema = z.object({
  /** API may serialize absent flags as null. */
  success: jsonBoolean(false),
  user: userSchema.optional(),
  data: userSchema.optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

export type UserResponseValidated = z.infer<typeof userResponseSchema>;
