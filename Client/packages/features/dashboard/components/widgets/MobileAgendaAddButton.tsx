import { useCallback, useState } from "react";

import { type AgendaTodoFormSubmitPayload,AgendaTodoModal } from "packages/features/calendar";
import { log } from "packages/logger";
import { Pressable, Text } from "packages/ui/components/structure/primitives";

export type MobileAgendaAddButtonProps = {
  onSubmitTodo: (payload: AgendaTodoFormSubmitPayload) => Promise<void>;
  /** When true, show Meet toggle for dated flows that create a Google Calendar event. */
  googleCalendarCreateEligible?: boolean;
};

export function MobileAgendaAddButton({
  onSubmitTodo,
  googleCalendarCreateEligible = false,
}: MobileAgendaAddButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleSubmit = useCallback(
    async (payload: AgendaTodoFormSubmitPayload) => {
      try {
        await onSubmitTodo(payload);
        closeModal();
      } catch (error) {
        log.error("DASHBOARD", "Failed to add agenda item (mobile)", error);
        throw error;
      }
    },
    [closeModal, onSubmitTodo]
  );

  return (
    <>
      <Pressable
        onPress={() => setModalOpen(true)}
        className="border-border flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-dashed px-3 py-2 active:opacity-80"
      >
        <Text className="text-primary text-center text-sm font-medium">Add</Text>
      </Pressable>

      <AgendaTodoModal
        isOpen={modalOpen}
        onClose={closeModal}
        mode="create"
        onSubmit={handleSubmit}
        googleCalendarCreateEligible={googleCalendarCreateEligible}
      />
    </>
  );
}
