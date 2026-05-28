const TITLE_MAX_LEN = 200;
const DESCRIPTION_MAX_LEN = 4000;

export type SchedulingFormValidationResult = { ok: true } | { ok: false; message: string };

export function validateSchedulingFormInput(
  title: string,
  description: string,
  hasSelectedSlot: boolean
): SchedulingFormValidationResult {
  if (!hasSelectedSlot) {
    return { ok: false, message: "Select a time slot before scheduling." };
  }
  const trimmedTitle = title.trim();
  if (trimmedTitle.length > TITLE_MAX_LEN) {
    return { ok: false, message: `Title must be at most ${TITLE_MAX_LEN} characters.` };
  }
  if (description.length > DESCRIPTION_MAX_LEN) {
    return {
      ok: false,
      message: `Description must be at most ${DESCRIPTION_MAX_LEN} characters.`,
    };
  }
  return { ok: true };
}
