import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(256),
});

export type LoginRequestInput = z.infer<typeof loginRequestSchema>;
