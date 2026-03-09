import { BodyText, Button, CancelButton, Textarea } from "@/components/ui";

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
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <BodyText size="sm" className="mb-3 text-red-900">
        Are you sure you want to void this agreement? This action cannot be undone.
      </BodyText>
      <Textarea
        value={voidReason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder="Reason for voiding (optional)..."
        rows={2}
        className="mb-3 w-full rounded-lg border border-red-300 px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-2">
        <Button variant="danger" size="sm" onClick={onConfirm} disabled={isVoiding}>
          {isVoiding ? "Voiding..." : "Confirm Void"}
        </Button>
        <CancelButton size="sm" onClick={onCancel}>
          Cancel
        </CancelButton>
      </div>
    </div>
  );
}
