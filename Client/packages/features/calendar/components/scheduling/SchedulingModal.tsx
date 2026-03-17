import { useEffect, useState } from "react";

import { log, LOG_CATEGORIES } from "packages/logger";
import { useGoogleCalendarStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";
import { dateNow } from "packages/utils/date";

import { BodyText, Button, CancelButton, Title } from "@/components/ui";
import { useGoogleCalendarOAuth } from "@/features/calendar/hooks/data/useGoogleCalendarOAuth";
import { useScheduling } from "@/features/calendar/hooks/data/useScheduling";
import type { ScheduleEventRequest } from "@/packages/schemas/scheduling";

import { SchedulingForm } from "./SchedulingForm";
import { TimeSlotPicker } from "./TimeSlotPicker";

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

  const handleSlotSelect = (slot: { start: Date; end: Date; isAvailable: boolean }) => {
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
      <Box className="space-y-responsive-md mobile-padding">
        <Box className="text-center">
          <Title as="h2" size="sm" className="text-text-primary">
            Connect Google Calendar
          </Title>
          <BodyText as="p" size="sm" className="text-text-secondary mt-2">
            Connect your Google Calendar to check availability and schedule events. We'll only see
            when you're busy, not your event details.
          </BodyText>
        </Box>

        <Box className="space-y-responsive-sm">
          <Button variant="primary" onClick={handleConnect} fullWidth className="w-full">
            Connect Google Calendar
          </Button>
          <CancelButton onClick={onClose} fullWidth>
            Cancel
          </CancelButton>
        </Box>
      </Box>
    );
  }

  if (step === "select") {
    return (
      <Box className="space-y-responsive-md mobile-padding">
        <Box>
          <Title as="h2" size="sm" className="text-text-primary">
            Select a Time Slot
          </Title>
          <BodyText as="p" size="sm" className="text-text-secondary mt-1">
            Choose an available time slot for your event.
          </BodyText>
        </Box>

        {scheduling.isLoadingAvailability && (
          <Box className="py-responsive-md text-responsive-sm text-text-secondary text-center">
            Loading availability...
          </Box>
        )}

        {scheduling.availabilityError && (
          <Box className="p-responsive-sm text-responsive-sm bg-primary-muted text-destructive rounded-md">
            {scheduling.availabilityError instanceof Error
              ? scheduling.availabilityError.message
              : "Failed to load availability"}
          </Box>
        )}

        {!scheduling.isLoadingAvailability && !scheduling.availabilityError && (
          <TimeSlotPicker
            slots={scheduling.slots}
            selectedSlot={scheduling.selectedSlot}
            onSelectSlot={handleSlotSelect}
            isLoading={scheduling.isLoadingAvailability}
          />
        )}

        <Box className="gap-responsive-sm pt-responsive-md flex">
          <CancelButton onClick={onClose} fullWidth>
            Cancel
          </CancelButton>
        </Box>
      </Box>
    );
  }

  if (step === "form") {
    return (
      <Box className="space-y-responsive-md mobile-padding">
        <Box>
          <Title as="h2" size="sm" className="text-text-primary">
            Schedule Event
          </Title>
          {scheduling.selectedSlot && (
            <BodyText as="p" size="sm" className="text-text-secondary mt-1">
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
        </Box>

        <SchedulingForm
          selectedSlot={scheduling.selectedSlot}
          onSubmit={handleSubmit}
          onCancel={handleBack}
          isLoading={scheduling.isScheduling}
        />

        {scheduling.schedulingError && (
          <Box className="p-responsive-sm text-responsive-sm bg-primary-muted text-destructive rounded-md">
            {scheduling.schedulingError instanceof Error
              ? scheduling.schedulingError.message
              : "Failed to schedule event"}
          </Box>
        )}
      </Box>
    );
  }

  return null;
}
