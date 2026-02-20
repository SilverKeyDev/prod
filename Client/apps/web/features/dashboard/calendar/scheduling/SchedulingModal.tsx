import { useEffect, useState } from "react";

import { log, LOG_CATEGORIES } from "logger";

import { useGoogleCalendarOAuth } from "packages/hooks/data/calendar/useGoogleCalendarOAuth";
import { useScheduling } from "packages/hooks/data/calendar/useScheduling";
import { useGoogleCalendarStore } from "packages/store";
import { dateNow } from "packages/utils/core/date";

import Button from "@/components/ui/button/Button";
import CancelButton from "@/components/ui/button/CancelButton";
import { BodyText, Title } from "@/components/ui/index.web";
import type { ScheduleEventRequest } from "@/packages/schemas/scheduling";

import { SchedulingForm } from "./components/SchedulingForm";
import { TimeSlotPicker } from "./components/TimeSlotPicker";

interface SchedulingModalProps {
  onClose: () => void;
  buyerName?: string;
}

export function SchedulingModal({ onClose }: SchedulingModalProps) {
  const isConnected = useGoogleCalendarStore((s) => s.isConnected);
  const { startOAuth } = useGoogleCalendarOAuth();
  const [step, setStep] = useState<"connect" | "select" | "form">("connect");

  // Calculate date range (next 14 days)
  const startDate = dateNow().startOf("day").toDate();
  const endDate = dateNow().startOf("day").add(14, "day").toDate();

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
    startOAuth(true); // Use scheduling scopes
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
      log.error(LOG_CATEGORIES.CALENDAR, "Failed to schedule event", error);
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
          <Title as="h2" size="sm" className="text-neutral-900">
            Connect Google Calendar
          </Title>
          <BodyText as="p" size="sm" className="mt-2 text-neutral-500">
            Connect your Google Calendar to check availability and schedule
            events. We'll only see when you're busy, not your event details.
          </BodyText>
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
          <CancelButton onClick={onClose} fullWidth>
            Cancel
          </CancelButton>
        </div>
      </div>
    );
  }

  if (step === "select") {
    return (
      <div className="space-y-responsive-md mobile-padding">
        <div>
          <Title as="h2" size="sm" className="text-neutral-900">
            Select a Time Slot
          </Title>
          <BodyText as="p" size="sm" className="mt-1 text-neutral-500">
            Choose an available time slot for your event.
          </BodyText>
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
          <CancelButton onClick={onClose} fullWidth>
            Cancel
          </CancelButton>
        </div>
      </div>
    );
  }

  if (step === "form") {
    return (
      <div className="space-y-responsive-md mobile-padding">
        <div>
          <Title as="h2" size="sm" className="text-neutral-900">
            Schedule Event
          </Title>
          {scheduling.selectedSlot && (
            <BodyText as="p" size="sm" className="mt-1 text-neutral-500">
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
            </BodyText>
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
