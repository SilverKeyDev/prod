import React, { useState, useMemo } from "react";
import BaseModal from "./BaseModal";
import { BodyText, Button, CancelButton } from "../ui";

export type NotInterestedReason = {
  id: string;
  label: string;
};

const ALL_REASONS: NotInterestedReason[] = [
  { id: "price", label: "Price is too high" },
  { id: "location", label: "Location doesn't work" },
  { id: "size", label: "Too small or too large" },
  { id: "condition", label: "Needs too much work" },
  { id: "neighborhood", label: "Not the right neighborhood" },
  { id: "schools", label: "Schools don't meet needs" },
  { id: "commute", label: "Commute is too long" },
  { id: "layout", label: "Layout doesn't work" },
  { id: "yard", label: "Yard size or features" },
  { id: "timing", label: "Timing isn't right" },
];

export type NotInterestedModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (why?: string) => void;
  propertyAddress?: string;
};

export default function NotInterestedModal({
  isOpen,
  onClose,
  onConfirm,
  propertyAddress,
}: NotInterestedModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");

  // Get 2 random reasons + "Other" option
  const availableReasons = useMemo(() => {
    // Shuffle array and take first 2
    const shuffled = [...ALL_REASONS].sort(() => Math.random() - 0.5);
    const randomTwo = shuffled.slice(0, 2);
    return [...randomTwo, { id: "other", label: "Other" }];
  }, [isOpen]); // Regenerate when modal opens

  const handleConfirm = () => {
    let why: string | undefined;
    if (selectedReason === "other") {
      why = customReason.trim() || undefined;
    } else if (selectedReason) {
      const reason = ALL_REASONS.find((r) => r.id === selectedReason);
      why = reason?.label;
    }
    onConfirm(why);
    // Reset state
    setSelectedReason(null);
    setCustomReason("");
  };

  const handleClose = () => {
    setSelectedReason(null);
    setCustomReason("");
    onClose();
  };

  const canConfirm = selectedReason === "other" 
    ? customReason.trim().length > 0 
    : selectedReason !== null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Why isn't this home a fit?"
      size="sm"
      closeOnBackdropClick={true}
      closeOnEscape={true}
      footerContent={
        <div className="flex gap-3 justify-end">
          <CancelButton
            type="button"
            onClick={() => {
              onConfirm(undefined);
              handleClose();
            }}
            size="md"
          >
            Skip
          </CancelButton>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            Confirm
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {propertyAddress && (
          <BodyText size="sm" muted>
            Help us understand why <span className="font-medium">{propertyAddress}</span> isn't a good fit.
          </BodyText>
        )}
        
        <div className="space-y-2">
          {availableReasons.map((reason) => (
            <label
              key={reason.id}
              className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                selectedReason === reason.id
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="not-interested-reason"
                value={reason.id}
                checked={selectedReason === reason.id}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300"
              />
              <span className="ml-3 text-sm text-gray-900">{reason.label}</span>
            </label>
          ))}
        </div>

        {selectedReason === "other" && (
          <div className="mt-4">
            <label htmlFor="custom-reason" className="block text-sm font-medium text-gray-700 mb-2">
              Please tell us more
            </label>
            <textarea
              id="custom-reason"
              rows={3}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter your reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500 text-sm"
            />
          </div>
        )}
      </div>
    </BaseModal>
  );
}
