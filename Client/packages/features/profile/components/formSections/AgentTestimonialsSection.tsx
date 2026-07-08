import type {
  AgentTestimonial,
  OnboardingData,
} from "packages/features/profile/types/onboarding/onboarding";
import { FormFieldLabel as Label } from "packages/ui";
import {
  Box,
  Pressable,
  PrimitiveInput,
  Text,
} from "packages/ui/components/structure/primitives";

export const AGENT_TESTIMONIALS_MAX = 12;

const INPUT_CLASS =
  "border-border bg-background-surface text-text-primary rounded-lg border px-4 py-3 text-base";

export type AgentTestimonialsSectionProps = {
  formData: OnboardingData;
  isEditMode: boolean;
  updateFormData: (field: keyof OnboardingData, value: unknown) => void;
};

/**
 * Object-list editor for agent-managed testimonials (author, quote, optional
 * date and 1-5 rating). Incomplete rows are kept while editing; the server
 * write drops items missing author or quote. Capped at
 * {@link AGENT_TESTIMONIALS_MAX} entries.
 */
export default function AgentTestimonialsSection({
  formData,
  isEditMode,
  updateFormData,
}: AgentTestimonialsSectionProps) {
  const items = Array.isArray(formData.agent_testimonials)
    ? formData.agent_testimonials
    : [];

  const setItems = (next: AgentTestimonial[]) => {
    updateFormData("agent_testimonials", next);
  };

  const updateItem = (index: number, patch: Partial<AgentTestimonial>) => {
    const next = [...items];
    const existing = next[index] ?? { author_name: "", quote: "" };
    next[index] = { ...existing, ...patch };
    setItems(next);
  };

  const handleRatingChange = (index: number, text: string) => {
    const trimmed = text.trim();
    if (trimmed === "") {
      updateItem(index, { rating: null });
      return;
    }
    const parsed = Number.parseInt(trimmed, 10);
    if (!Number.isNaN(parsed)) {
      updateItem(index, { rating: Math.min(5, Math.max(1, parsed)) });
    }
  };

  const handleAdd = () => {
    if (items.length >= AGENT_TESTIMONIALS_MAX) return;
    setItems([...items, { author_name: "", quote: "", source: "custom" }]);
  };

  const handleRemove = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  if (!isEditMode) {
    if (!items.length) {
      return (
        <Box className="border-border bg-background-base rounded-lg border px-4 py-3">
          <Text className="text-text-secondary text-sm">
            No testimonials yet.
          </Text>
        </Box>
      );
    }
    return (
      <Box className="gap-2">
        {items.map((item, index) => (
          <Box
            key={index}
            className="border-border bg-background-surface rounded-lg border px-4 py-3"
          >
            <Text className="text-text-primary text-sm">“{item.quote}”</Text>
            <Text className="text-text-secondary mt-1 text-xs">
              {item.author_name}
              {item.date ? ` · ${item.date}` : ""}
              {item.rating != null ? ` · ${item.rating}/5` : ""}
            </Text>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box className="gap-4">
      {items.map((item, index) => (
        <Box
          key={index}
          className="border-border bg-background-base gap-2 rounded-lg border p-4"
        >
          <Label className="block">
            Testimonial {items.length > 1 ? index + 1 : ""}
          </Label>
          <PrimitiveInput
            value={item.author_name ?? ""}
            onValueChange={(v) => updateItem(index, { author_name: v ?? "" })}
            placeholder="Client name"
            className={INPUT_CLASS}
          />
          <PrimitiveInput
            value={item.quote ?? ""}
            onValueChange={(v) => updateItem(index, { quote: v ?? "" })}
            placeholder="What did they say?"
            multiline
            className={INPUT_CLASS}
          />
          <Box className="flex flex-row gap-2">
            <PrimitiveInput
              value={item.date ?? ""}
              onValueChange={(v) =>
                updateItem(index, { date: v?.trim() ? v : null })
              }
              placeholder="Date (YYYY-MM-DD, optional)"
              className={`${INPUT_CLASS} flex-1`}
            />
            <PrimitiveInput
              value={item.rating != null ? String(item.rating) : ""}
              onValueChange={(v) => handleRatingChange(index, v ?? "")}
              placeholder="Rating 1–5"
              keyboardType="number-pad"
              className={`${INPUT_CLASS} w-28`}
            />
          </Box>
          <Pressable
            onPress={() => handleRemove(index)}
            className="border-border bg-background-surface self-start rounded-lg border px-3 py-2"
          >
            <Text className="text-sm font-medium text-red-600">Remove</Text>
          </Pressable>
        </Box>
      ))}

      {items.length < AGENT_TESTIMONIALS_MAX ? (
        <Pressable
          onPress={handleAdd}
          className="border-border bg-background-base rounded-lg border-2 border-dashed py-3"
        >
          <Text className="text-text-secondary text-center text-sm font-medium">
            Add a testimonial
          </Text>
        </Pressable>
      ) : (
        <Text className="text-text-secondary text-xs">
          Maximum of {AGENT_TESTIMONIALS_MAX} testimonials reached.
        </Text>
      )}
    </Box>
  );
}
