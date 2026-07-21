import { Button, CancelButton } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import { twMergeClasses } from "packages/ui/utils/twMergeClasses";

type AgendaItemEditActionsProps = {
  onEdit: () => void;
  onCancel: () => void;
  className?: string;
};

export function AgendaItemEditActions({ onEdit, onCancel, className }: AgendaItemEditActionsProps) {
  return (
    <Box className={twMergeClasses("flex shrink-0 flex-row items-center gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onPress={onEdit}
        iconName="pencil"
        label="Edit"
        className="min-h-touch shrink-0"
      >
        Edit
      </Button>
      <CancelButton size="sm" onPress={onCancel} label="Cancel" className="min-h-touch shrink-0">
        Cancel
      </CancelButton>
    </Box>
  );
}
