import {
  BodyText,
  Button,
  CancelButton,
  Textarea,
} from "@/components/ui/index.web";

type VoidConfirmationProps = {
  voidReason: string;
  isVoiding: boolean;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * VoidConfirmation Component
 *
 * Confirmation UI for voiding an agreement
 * Displays warning message and optional reason input
 */
export default function VoidConfirmation({
  voidReason,
  isVoiding,
  onReasonChange,
  onConfirm,
  onCancel,
}: VoidConfirmationProps) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <BodyText size="sm" className="text-red-900 mb-3">
        Are you sure you want to void this agreement? This action cannot be
        undone.
      </BodyText>
      <Textarea
        value={voidReason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder="Reason for voiding (optional)..."
        rows={2}
        className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm mb-3"
      />
      <div className="flex items-center gap-2">
        <Button
          variant="danger"
          size="sm"
          onClick={onConfirm}
          disabled={isVoiding}
        >
          {isVoiding ? "Voiding..." : "Confirm Void"}
        </Button>
        <CancelButton size="sm" onClick={onCancel}>
          Cancel
        </CancelButton>
      </div>
    </div>
  );
}
