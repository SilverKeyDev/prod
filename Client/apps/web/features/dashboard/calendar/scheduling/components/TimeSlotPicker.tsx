import React from "react";

import {
  formatDateLabel,
  formatTimeSlot,
} from "packages/utils/domain/calendar/scheduling";

import { BodyText, Button, Title } from "@/components/ui/index.web";
import type { TimeSlot } from "@/packages/schemas/scheduling";

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  isLoading?: boolean;
}

export function TimeSlotPicker({
  slots,
  selectedSlot,
  onSelectSlot,
  isLoading,
}: TimeSlotPickerProps) {
  // Group slots by date
  const slotsByDate = React.useMemo(() => {
    const grouped: Record<string, TimeSlot[]> = {};

    slots.forEach((slot) => {
      const dateKey = slot.start.toISOString().split("T")[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(slot);
    });

    return grouped;
  }, [slots]);

  const availableSlots = slots.filter((slot) => slot.isAvailable);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-responsive-lg">
        <div className="text-responsive-sm text-neutral-500">
          Loading available time slots...
        </div>
      </div>
    );
  }

  if (availableSlots.length === 0) {
    return (
      <div className="py-responsive-lg text-center">
        <BodyText as="p" size="sm" className="text-neutral-500">
          No available time slots in the selected range.
        </BodyText>
        <BodyText as="p" size="xs" className="mt-2 text-neutral-400">
          Try selecting a different date range.
        </BodyText>
      </div>
    );
  }

  return (
    <div className="space-y-responsive-md">
      {Object.entries(slotsByDate)
        .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
        .map(([dateKey, dateSlots]) => {
          const availableDateSlots = dateSlots.filter(
            (slot) => slot.isAvailable,
          );
          if (availableDateSlots.length === 0) {
            return null;
          }

          const firstSlot = dateSlots[0];
          const dateLabel = formatDateLabel(firstSlot.start);

          return (
            <div key={dateKey} className="space-y-responsive-xs">
              <Title as="h3" size="sm" className="font-medium text-neutral-900">
                {dateLabel}
              </Title>
              <div className="grid grid-cols-2 gap-responsive-xs sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {availableDateSlots.map((slot, index) => {
                  const isSelected =
                    selectedSlot?.start.getTime() === slot.start.getTime();
                  const startTime = formatTimeSlot(slot.start);
                  const endTime = formatTimeSlot(slot.end);

                  return (
                    <Button
                      key={`${slot.start.getTime()}-${index}`}
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => onSelectSlot(slot)}
                      className={`touch-friendly rounded-lg px-responsive-xs py-responsive-xs text-responsive-xs transition-colors ${
                        isSelected
                          ? "border-olive bg-olive/10 text-olive font-medium"
                          : "border-beige bg-white text-neutral-700 hover:border-brown/50 hover:bg-brown/5 active:bg-brown/10"
                      }`}
                    >
                      <div className="font-medium">{startTime}</div>
                      <div className="text-responsive-xs text-neutral-500">
                        {endTime}
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
}
