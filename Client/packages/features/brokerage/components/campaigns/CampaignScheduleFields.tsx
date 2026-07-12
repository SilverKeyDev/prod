import { Button } from "packages/ui";
import { Input } from "packages/ui/components/inputs/form/inputs/Input.web";
import { Box } from "packages/ui/components/structure/primitives";
import Label from "packages/ui/components/structure/text/Label";

type CampaignScheduleFieldsProps = {
  scheduleMode: "now" | "later";
  onScheduleModeChange: (mode: "now" | "later") => void;
  scheduledDate: string;
  onScheduledDateChange: (value: string) => void;
  scheduledTime: string;
  onScheduledTimeChange: (value: string) => void;
};

export function CampaignScheduleFields({
  scheduleMode,
  onScheduleModeChange,
  scheduledDate,
  onScheduledDateChange,
  scheduledTime,
  onScheduledTimeChange,
}: CampaignScheduleFieldsProps) {
  return (
    <Box className="flex flex-col gap-3">
      <Label size="sm">When</Label>
      <Box className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={scheduleMode === "now" ? "secondary" : "outline"}
          onClick={() => onScheduleModeChange("now")}
        >
          Send now
        </Button>
        <Button
          type="button"
          size="sm"
          variant={scheduleMode === "later" ? "secondary" : "outline"}
          onClick={() => onScheduleModeChange("later")}
        >
          Schedule
        </Button>
      </Box>
      {scheduleMode === "later" ? (
        <Box className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Date"
            type="date"
            value={scheduledDate}
            onValueChange={onScheduledDateChange}
            required
          />
          <Input
            label="Time"
            type="time"
            value={scheduledTime}
            onValueChange={onScheduledTimeChange}
            required
          />
        </Box>
      ) : null}
    </Box>
  );
}
