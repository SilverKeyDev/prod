import { Pressable, Text } from "packages/ui/components/structure/primitives";

type AgendaCompleteControlProps = {
  completed: boolean;
  canToggle: boolean;
  onToggle: () => void;
};

export function AgendaCompleteControl({
  completed,
  canToggle,
  onToggle,
}: AgendaCompleteControlProps) {
  return (
    <Pressable
      onPress={() => (canToggle ? onToggle() : undefined)}
      disabled={!canToggle}
      className={`h-6 w-6 flex-shrink-0 items-center justify-center rounded border-2 ${
        completed
          ? "border-primary bg-primary"
          : canToggle
            ? "border-border active:border-neutral-400"
            : "border-border"
      }`}
    >
      {completed ? <Text className="text-xs font-semibold text-white">✓</Text> : null}
    </Pressable>
  );
}
