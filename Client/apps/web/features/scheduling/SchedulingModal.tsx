import { useState, useEffect } from "react";

import { useScheduling } from "../../../../packages/hooks/data/useScheduling";
import { useGoogleCalendar } from "../../../../packages/hooks/data/useGoogleCalendar";
import { googleCalendarApi } from "../../../../packages/config/api";
import type { ScheduleEventRequest } from "../../../../packages/schemas/scheduling";
import { TimeSlotPicker } from "./components/TimeSlotPicker";
import { SchedulingForm } from "./components/SchedulingForm";
import Button from "../../components/ui/button/Button";

interface SchedulingModalProps {
  onClose: () => void;
  buyerName?: string;
}

export function SchedulingModal({ onClose }: SchedulingModalProps) {
  const { isConnected } = useGoogleCalendar();
  const [step, setStep] = useState<"connect" | "select" | "form">("connect");

  // Calculate date range (next 14 days)
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 14);

  const scheduling = useScheduling(startDate, endDate, 30);

  useEffect(() => {
    if (isConnected && scheduling.silverKeyCalendarId) {
      setStep("select");
    } else if (isConnected) {
      // Calendar connected but SilverKey calendar not ready yet
      setStep("select");
    }
  }, [isConnected, scheduling.silverKeyCalendarId]);

  const handleConnect = () => {
    googleCalendarApi.startOAuth(true); // Use scheduling scopes
  };

  const handleSlotSelect = (slot: {
    start: Date;
    end: Date;
    isAvailable: boolean;
  }) => {
    scheduling.setSelectedSlot(slot);
    setStep("form");
  };

  const handleSubmit = async (eventData: ScheduleEventRequest) => {
    try {
      await scheduling.scheduleEvent(eventData);
      // Success - close modal or show success message
      onClose();
    } catch (error) {
      console.error("Failed to schedule event:", error);
      // Error handling is done in the hook
    }
  };

  const handleBack = () => {
    if (step === "form") {
      setStep("select");
      scheduling.setSelectedSlot(null);
    }
  };

  if (!isConnected) {
    return (
      <div className="space-y-responsive-md mobile-padding">
        <div className="text-center">
          <h2 className="heading-responsive-sm text-neutral-900">
            Connect Google Calendar
          </h2>
          <p className="mt-2 text-responsive-sm text-neutral-500">
            Connect your Google Calendar to check availability and schedule
            events. We'll only see when you're busy, not your event details.
          </p>
        </div>

        <div className="space-y-responsive-sm">
          <Button
            variant="primary"
            onClick={handleConnect}
            fullWidth
            className="w-full"
          >
            Connect Google Calendar
          </Button>
          <Button variant="outline" onClick={onClose} fullWidth>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (step === "select") {
    return (
      <div className="space-y-responsive-md mobile-padding">
        <div>
          <h2 className="heading-responsive-sm text-neutral-900">
            Select a Time Slot
          </h2>
          <p className="mt-1 text-responsive-sm text-neutral-500">
            Choose an available time slot for your event.
          </p>
        </div>

        {scheduling.isLoadingAvailability && (
          <div className="py-responsive-md text-center text-responsive-sm text-neutral-500">
            Loading availability...
          </div>
        )}

        {scheduling.availabilityError && (
          <div className="rounded-md bg-rose-50 p-responsive-sm text-responsive-sm text-rose-800">
            {scheduling.availabilityError instanceof Error
              ? scheduling.availabilityError.message
              : "Failed to load availability"}
          </div>
        )}

        {!scheduling.isLoadingAvailability && !scheduling.availabilityError && (
          <TimeSlotPicker
            slots={scheduling.slots}
            selectedSlot={scheduling.selectedSlot}
            onSelectSlot={handleSlotSelect}
            isLoading={scheduling.isLoadingAvailability}
          />
        )}

        <div className="flex gap-responsive-sm pt-responsive-md">
          <Button variant="outline" onClick={onClose} fullWidth>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (step === "form") {
    return (
      <div className="space-y-responsive-md mobile-padding">
        <div>
          <h2 className="heading-responsive-sm text-neutral-900">
            Schedule Event
          </h2>
          {scheduling.selectedSlot && (
            <p className="mt-1 text-responsive-sm text-neutral-500">
              {scheduling.selectedSlot.start.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              at{" "}
              {scheduling.selectedSlot.start.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          )}
        </div>

        <SchedulingForm
          selectedSlot={scheduling.selectedSlot}
          onSubmit={handleSubmit}
          onCancel={handleBack}
          isLoading={scheduling.isScheduling}
        />

        {scheduling.schedulingError && (
          <div className="rounded-md bg-rose-50 p-responsive-sm text-responsive-sm text-rose-800">
            {scheduling.schedulingError instanceof Error
              ? scheduling.schedulingError.message
              : "Failed to schedule event"}
          </div>
        )}
      </div>
    );
  }

  return null;
}
