/**
 * Zod schemas for user API boundaries (runtime validation).
 * Use .safeParse() at the boundary and throw or normalize on failure.
 */
import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  cognito_id: z.string(),
  email: z.string(),
  name: z.string(),
  phone: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
  is_active: z.boolean(),
  is_agent: z.boolean().optional(),
  is_closing_mode: z.boolean().optional(),
  client_ids: z.array(z.string()).optional(),
  agency_name: z.string().optional(),
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
