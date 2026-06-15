import { z } from "zod";

export const agentSearchQuerySchema = z.object({
  q: z.string().max(200).optional().default(""),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const feedListQuerySchema = z.object({
  page: z.coerce.number().int().min(0).max(10000).optional().default(0),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type AgentSearchQueryInput = z.infer<typeof agentSearchQuerySchema>;
