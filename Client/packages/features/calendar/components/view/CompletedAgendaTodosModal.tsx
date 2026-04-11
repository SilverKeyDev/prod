import BaseModal from "packages/ui/components/modals/BaseModal";
import { Box, Text } from "packages/ui/components/primitives";

import type { AgendaTodoDTO } from "@/features/calendar/types/agenda";

import { TodoAgendaRow } from "./TodoAgendaRow";

type CompletedAgendaTodosModalProps = {
  isOpen: boolean;
  onClose: () => void;
  completedTodos: AgendaTodoDTO[];
  onToggleAgendaTodo?: (id: string) => void;
  canEditAgendaTodos?: boolean;
};

export function CompletedAgendaTodosModal({
  isOpen,
  onClose,
  completedTodos,
  onToggleAgendaTodo,
  canEditAgendaTodos = false,
}: CompletedAgendaTodosModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Completed to-dos"
      size="md"
      showCloseButton
    >
      {completedTodos.length === 0 ? (
        <Box className="py-4">
          <Text className="text-text-secondary text-sm">
            No completed to-dos yet.
          </Text>
        </Box>
      ) : (
        <Box className="pb-2">
          {completedTodos.map((todo) => (
            <Box key={todo.id} className="mb-2">
              <TodoAgendaRow
                todo={todo}
                onToggleComplete={(id) => onToggleAgendaTodo?.(id)}
                canEditComplete={Boolean(
                  canEditAgendaTodos && onToggleAgendaTodo,
                )}
              />
            </Box>
          ))}
        </Box>
      )}
    </BaseModal>
  );
}
