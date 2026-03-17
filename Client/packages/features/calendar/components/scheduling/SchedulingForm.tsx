import { useState } from "react";

import Button from "packages/ui/components/button/Button";
import CancelButton from "packages/ui/components/button/CancelButton";

import { Input, Label, Textarea } from "@/components/ui";

type TimeSlot = { start: Date; end: Date; isAvailable: boolean };

type ScheduleEventRequest = {
  title?: string;
  description?: string;
  start: string;
  end: string;
  attendeeEmail?: string;
};

type SchedulingFormProps = {
  selectedSlot: TimeSlot | null;
  onSubmit: (data: ScheduleEventRequest) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
};

export function SchedulingForm({
  selectedSlot,
  onSubmit,
  onCancel,
  isLoading,
}: SchedulingFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    await onSubmit({
      title: title || "Scheduled event",
      description: description || undefined,
      start: selectedSlot.start.toISOString(),
      end: selectedSlot.end.toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label size="sm">Title</Label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          className="border-border mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <Label size="sm">Description (optional)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details..."
          rows={2}
          className="border-border mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </div>
      <div className="flex gap-2">
        <CancelButton type="button" onClick={onCancel}>
          Back
        </CancelButton>
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? "Scheduling..." : "Schedule"}
        </Button>
      </div>
    </form>
  );
}
