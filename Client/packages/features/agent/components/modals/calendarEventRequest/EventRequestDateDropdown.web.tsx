import Dropdown from "packages/ui/components/form/dropdown";
import { Box } from "packages/ui/components/primitives";
import type { EventScheduleOption } from "packages/utils/scheduling/eventRequestScheduleOptions";

export type EventRequestDateDropdownProps = {
  minDate: string;
  value: string;
  onChange: (value: string) => void;
  /** Date rows with availability styling (from `useEventRequestScheduleAvailability`). */
  options: EventScheduleOption[];
};

export function EventRequestDateDropdown({
  minDate: _minDate,
  value,
  onChange,
  options,
}: EventRequestDateDropdownProps) {
  const dropdownOptions = options.map((o) => ({
    value: o.value,
    label: o.label,
    disabled: o.disabled,
    menuRowClassName: o.menuRowClassName,
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
        menuInPortal
        menuPortalStack="modal"
      />
    </Box>
  );
}
