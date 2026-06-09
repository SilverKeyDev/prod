import { Button, CancelButton } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";

type AgendaItemEditActionsProps = {
  onEdit: () => void;
  onCancel: () => void;
};

export function AgendaItemEditActions({ onEdit, onCancel }: AgendaItemEditActionsProps) {
  return (
    <Box className="flex flex-shrink-0 flex-row flex-wrap justify-end gap-2">
      <Button variant="outline" size="sm" onPress={onEdit} iconName="pencil">
        Edit
      </Button>
      <CancelButton size="sm" onPress={onCancel}>
        Cancel
      </CancelButton>
    </Box>
  );
}
