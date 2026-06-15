import { TodoAgendaRow } from "packages/features/calendar/components/view/agenda/TodoAgendaRow";
import type { AgendaTodoDTO } from "packages/features/calendar/types/agenda";
import type { TaskChecklistItem } from "packages/features/checklists/api/checklists";
import { Box } from "packages/ui/components/structure/primitives";

type ChecklistStepSigningFooterProps = {
  item: TaskChecklistItem;
  stepSigningTodos: AgendaTodoDTO[];
  onSigningPress: (agreementId: string) => void;
  className?: string;
};

export function ChecklistStepSigningFooter({
  item,
  stepSigningTodos,
  onSigningPress,
  className = "mt-2 flex flex-col gap-2 px-4 pb-3",
}: ChecklistStepSigningFooterProps) {
  const hasForm =
    item.completionType === "signature_based" ||
    (item.suggestedFormIds != null && item.suggestedFormIds.length > 0);
  if (!hasForm || stepSigningTodos.length === 0) {
    return null;
  }

  return (
    <Box className={className}>
      {stepSigningTodos.map((todo) => (
        <TodoAgendaRow
          key={todo.id}
          todo={todo}
          onToggleComplete={() => {}}
          onSigningPress={onSigningPress}
          canEditComplete={false}
        />
      ))}
    </Box>
  );
}
