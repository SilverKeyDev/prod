import { z } from "zod";

export const schedulingFormInputSchema = z.object({
  title: z.string().max(200),
  description: z.string().max(4000),
  hasSelectedSlot: z.boolean(),
});

export type SchedulingFormInput = z.infer<typeof schedulingFormInputSchema>;

export function validateSchedulingFormWithZod(
  title: string,
  description: string,
  hasSelectedSlot: boolean
): { ok: true } | { ok: false; message: string } {
  const result = schedulingFormInputSchema.safeParse({
    title,
    description,
    hasSelectedSlot,
  });
  if (result.success) {
    if (!hasSelectedSlot) {
      return { ok: false, message: "Select a time slot before scheduling." };
    }
    return { ok: true };
  }
  const first = result.error.issues[0];
  return { ok: false, message: first?.message ?? "Invalid scheduling form input." };
}
