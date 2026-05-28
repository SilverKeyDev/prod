import { z } from "zod";

export const checklistFormSendRequestSchema = z.object({
  method: z.enum(["docusign", "messaging", "both"]),
  conversation_id: z.string().max(64).nullable().optional(),
  client_id: z.string().max(64).nullable().optional(),
  message: z.string().max(4000).nullable().optional(),
  participants: z
    .array(
      z.object({
        email: z.string().email().max(320),
        name: z.string().max(200),
      })
    )
    .nullable()
    .optional(),
});

export type ChecklistFormSendRequestInput = z.infer<typeof checklistFormSendRequestSchema>;
