import React, { useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import Button from "packages/ui/components/button/Button";
import CancelButton from "packages/ui/components/button/CancelButton";
import { Textarea } from "packages/ui/components/form/field/FormField";
import { Box } from "packages/ui/components/primitives";
import Input from "packages/ui/components/primitives/input/Input";
import BodyText from "packages/ui/components/text/BodyText";
import Label from "packages/ui/components/text/Label.web";

import BaseModal from "@/components/modals/BaseModal";

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
  const { t } = useLocalization();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");

  // Get 2 random reasons + "Other" option
  const availableReasons = useMemo(() => {
    // Shuffle array and take first 2
    const shuffled = [...ALL_REASONS].sort(() => Math.random() - 0.5);
    const randomTwo = shuffled.slice(0, 2);
    return [...randomTwo, { id: "other", label: "Other" }];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- regenerate when modal opens
  }, [isOpen]);

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

  const canConfirm =
    selectedReason === "other" ? customReason.trim().length > 0 : selectedReason !== null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("why_not.why_not_fit")}
      size="sm"
      closeOnBackdropClick={true}
      closeOnEscape={true}
      footerContent={
        <Box className="flex justify-end gap-3">
          <CancelButton
            type="button"
            onClick={() => {
              onConfirm(undefined);
              handleClose();
            }}
            size="md"
          >
            {t("common.skip")}
          </CancelButton>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleConfirm}
            disabled={!canConfirm}
            iconName="check"
          >
            {t("why_not.confirm")}
          </Button>
        </Box>
      }
    >
      <Box className="space-y-4">
        {propertyAddress && (
          <BodyText size="sm" muted>
            {t("why_not.help_understand", { address: propertyAddress })}
          </BodyText>
        )}

        <Box className="space-y-2">
          {availableReasons.map((reason) => (
            <Label
              key={reason.id}
              htmlFor={`not-interested-reason-${reason.id}`}
              className={`flex cursor-pointer items-center rounded-md border p-3 transition-colors ${
                selectedReason === reason.id
                  ? "border-border bg-primary-muted"
                  : "border-border hover:border-border"
              }`}
            >
              <Input
                type="radio"
                id={`not-interested-reason-${reason.id}`}
                name="not-interested-reason"
                value={reason.id}
                checked={selectedReason === reason.id}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="border-border text-text-primary h-4 w-4 focus:ring-neutral-400"
              />
              <BodyText as="span" className="ml-3 text-sm text-gray-900">
                {reason.id === "other"
                  ? t("why_not.other")
                  : t(`why_not.reason_${reason.id}` as "why_not.reason_price")}
              </BodyText>
            </Label>
          ))}
        </Box>

        {selectedReason === "other" && (
          <Box className="mt-4">
            <Label htmlFor="custom-reason" className="mb-2 block">
              {t("why_not.tell_more")}
            </Label>
            <Textarea
              id="custom-reason"
              rows={3}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder={t("why_not.reason_placeholder")}
              className="border-border focus:border-input-variant-focus-border w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-neutral-400"
            />
          </Box>
        )}
      </Box>
    </BaseModal>
  );
}
