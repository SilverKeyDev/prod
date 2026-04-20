import type { ReactNode } from "react";

import Button from "packages/ui/components/button/Button";
import { Box } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

type TimeSlot = { start: Date; end: Date; isAvailable: boolean };

type TimeSlotPickerProps = {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  isLoading: boolean;
};

export function TimeSlotPicker({
  slots,
  selectedSlot,
  onSelectSlot,
  isLoading,
}: TimeSlotPickerProps): ReactNode {
  if (isLoading) return <BodyText as="span">Loading availability...</BodyText>;
  return (
    <Box className="space-y-2">
      {slots.map((slot, i) => (
        <Button
          key={i}
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSelectSlot(slot)}
          className={`w-full rounded border p-2 text-left text-sm ${
            selectedSlot === slot ? "border-border bg-primary-muted" : "border-border"
          }`}
          disabled={!slot.isAvailable}
        >
          {slot.start.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}{" "}
          –{" "}
          {slot.end.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
          {!slot.isAvailable && " (unavailable)"}
        </Button>
      ))}
    </Box>
  );
}
