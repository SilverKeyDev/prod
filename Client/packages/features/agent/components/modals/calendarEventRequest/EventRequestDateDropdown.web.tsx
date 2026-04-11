import Dropdown from "packages/ui/components/form/Dropdown";
import { Box } from "packages/ui/components/primitives";

import {
  buildDateOptions,
  EVENT_REQUEST_DATE_RANGE_DAYS,
  type EventScheduleOption,
} from "./eventRequestScheduleOptions";

export type EventRequestDateDropdownProps = {
  minDate: string;
  value: string;
  onChange: (value: string) => void;
};

export function EventRequestDateDropdown({
  minDate,
  value,
  onChange,
}: EventRequestDateDropdownProps) {
  const options: EventScheduleOption[] = buildDateOptions(
    minDate,
    EVENT_REQUEST_DATE_RANGE_DAYS,
  );
  const dropdownOptions = options.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  return (
    <Box className="w-full">
      <Dropdown<string>
        label="Date"
        options={dropdownOptions}
        value={value === "" ? undefined : value}
        onChange={onChange}
        placeholder="Select date"
        searchable
        variant="compact"
        size="sm"
      />
    </Box>
  );
}
