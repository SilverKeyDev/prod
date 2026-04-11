import Dropdown from "packages/ui/components/form/Dropdown";
import { Box } from "packages/ui/components/primitives";

import {
  buildTimeOptions,
  EVENT_REQUEST_TIME_STEP_MINUTES,
  type EventScheduleOption,
} from "./eventRequestScheduleOptions";

export type EventRequestTimeDropdownProps = {
  value: string;
  onChange: (value: string) => void;
};

export function EventRequestTimeDropdown({
  value,
  onChange,
}: EventRequestTimeDropdownProps) {
  const options: EventScheduleOption[] = buildTimeOptions(
    EVENT_REQUEST_TIME_STEP_MINUTES,
  );
  const dropdownOptions = options.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  return (
    <Box className="w-full">
      <Dropdown<string>
        label="Time"
        options={dropdownOptions}
        value={value === "" ? undefined : value}
        onChange={onChange}
        placeholder="Select time"
        searchable
        variant="compact"
        size="sm"
      />
    </Box>
  );
}
