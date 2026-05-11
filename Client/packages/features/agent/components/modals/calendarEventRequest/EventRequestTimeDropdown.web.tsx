import { Dropdown } from "packages/ui";
import { Box } from "packages/ui/components/primitives";
import type { EventScheduleOption } from "packages/utils/scheduling/eventRequestScheduleOptions";

export type EventRequestTimeDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  /** Time rows for the selected date (from `useEventRequestScheduleAvailability`). */
  options: EventScheduleOption[];
};

export function EventRequestTimeDropdown({
  value,
  onChange,
  options,
}: EventRequestTimeDropdownProps) {
  const dropdownOptions = options.map((o) => ({
    value: o.value,
    label: o.label,
    disabled: o.disabled,
    menuRowClassName: o.menuRowClassName,
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
        menuInPortal
        menuPortalStack="modal"
      />
    </Box>
  );
}
