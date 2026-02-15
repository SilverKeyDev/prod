import React, { useState } from "react";

import type { ScheduleEventRequest } from "../../../../../packages/schemas/scheduling";
import Button from "../../../../../components/ui/button/Button";
import CancelButton from "../../../../../components/ui/button/CancelButton";
import Input from "../../../../../components/ui/form/Input";
import Label from "../../../../../components/ui/text/Label";
import Dropdown from "../../../../../components/ui/form/Dropdown";
import { Textarea } from "../../../../../components/ui/form/FormField";

interface SchedulingFormProps {
  selectedSlot: { start: Date; end: Date } | null;
  onSubmit: (eventData: ScheduleEventRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  defaultDuration?: number; // in minutes
}

export function SchedulingForm({
  selectedSlot,
  onSubmit,
  onCancel,
  isLoading = false,
  defaultDuration = 30,
}: SchedulingFormProps) {
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [attendees, setAttendees] = useState("");
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState(defaultDuration);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSlot) {
      return;
    }

    // Calculate end time based on duration
    const endTime = new Date(selectedSlot.start);
    endTime.setMinutes(endTime.getMinutes() + duration);

    // Parse attendees (comma or newline separated emails)
    const attendeeEmails = attendees
      .split(/[,\n]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0)
      .map((email) => ({ email }));

    const eventData: ScheduleEventRequest = {
      summary: summary.trim() || "SilverKey Event",
      description: description.trim() || undefined,
      start: selectedSlot.start.toISOString(),
      end: endTime.toISOString(),
      attendees: attendeeEmails.length > 0 ? attendeeEmails : undefined,
      location: location.trim() || undefined,
    };

    await onSubmit(eventData);
  };

  if (!selectedSlot) {
    return (
      <div className="py-responsive-md text-center text-responsive-sm text-neutral-500">
        Please select a time slot to continue.
      </div>
    );
  }

  const durationOptions: Array<{ value: number; label: string }> = [
    { value: 30, label: "30 minutes" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-responsive-md">
      <div>
        <Label htmlFor="summary" required>
          Event Title
        </Label>
        <Input
          id="summary"
          type="text"
          value={summary}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSummary(e.target.value)
          }
          placeholder="e.g., Home Tour, Inspection, Appraisal"
          required
          variant="mobile"
          size="md"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setDescription(e.target.value)
          }
          placeholder="Add any additional details..."
          rows={3}
          className="text-base sm:text-sm"
        />
      </div>

      <div>
        <Label htmlFor="duration">Duration</Label>
        <Dropdown
          options={durationOptions}
          value={duration}
          onChange={(value: number) => setDuration(value)}
          variant="mobile"
          size="md"
        />
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          type="text"
          value={location}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setLocation(e.target.value)
          }
          placeholder="e.g., Property address or meeting location"
          variant="mobile"
          size="md"
        />
      </div>

      <div>
        <Label htmlFor="attendees">Attendees</Label>
        <Textarea
          id="attendees"
          value={attendees}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setAttendees(e.target.value)
          }
          placeholder="Enter email addresses separated by commas or new lines"
          rows={2}
          className="text-base sm:text-sm"
        />
        <p className="mt-1 text-responsive-xs text-neutral-500">
          Attendees will receive Google Calendar invites
        </p>
      </div>

      <div className="flex-responsive gap-responsive-sm pt-responsive-md">
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
          className="flex-1"
          fullWidth
        >
          Schedule Event
        </Button>
        <CancelButton
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          fullWidth
        >
          Cancel
        </CancelButton>
      </div>
    </form>
  );
}
