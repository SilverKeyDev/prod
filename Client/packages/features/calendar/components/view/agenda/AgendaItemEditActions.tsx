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
    <Box className={twMergeClasses("w-full flex-row gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onPress={onEdit}
        iconName="pencil"
        label="Edit"
        className="min-h-touch min-w-0 flex-1"
      >
        Edit
      </Button>
      <CancelButton
        size="sm"
        onPress={onCancel}
        label="Cancel"
        className="min-h-touch min-w-0 flex-1"
      >
        Cancel
      </CancelButton>
    </Box>
  );
}
