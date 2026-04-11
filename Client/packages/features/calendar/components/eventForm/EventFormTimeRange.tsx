import { useCallback, useMemo } from "react";

import type { ReactNode } from "react";

import Dropdown from "packages/ui/components/form/Dropdown";
import { Box } from "packages/ui/components/primitives";
import Label from "packages/ui/components/text/Label.web";

import {
  CREATE_EVENT_TIME_STEP_MINUTES,
  parseHourMinute24,
} from "@/features/calendar/utils/eventFormGooglePayload";
import { buildTimeOptions } from "@/features/calendar/utils/scheduleTimeOptions";

function hhmmToMinutes(s: string): number {
  const p = parseHourMinute24(s);
  if (!p) {
    return 0;
  }
  return p.hour * 60 + p.minute;
}

function minutesToHhmm(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function nextValidEndAfterStart(startHhmm: string, step: number): string {
  const startM = hhmmToMinutes(startHhmm);
  const nextM = startM + step;
  const lastSlot = 24 * 60 - step;
  if (nextM > lastSlot) {
    return minutesToHhmm(lastSlot);
  }
  const snapped = Math.ceil(nextM / step) * step;
  const candidate = Math.min(snapped, lastSlot);
  return minutesToHhmm(candidate);
}

export type EventFormTimeRangeProps = {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  onStartTimeChange: (hhmm: string) => void;
  onEndTimeChange: (hhmm: string) => void;
  stepMinutes?: number;
  /** Opens option lists toward the top of the viewport (e.g. time row inside a modal). @default "below" */
  menuPlacement?: "below" | "above";
  /** Portals menus to document body so lists are not clipped by overflow containers. */
  menuInPortal?: boolean;
  /** Use `"modal"` when used inside a dialog so portaled menus stack above the modal. @default "page" */
  menuPortalStack?: "page" | "modal";
  /**
   * Optional control rendered in the same grid row as the time triggers (e.g. “All day”),
   * vertically centered with the dropdown buttons.
   */
  trailingSlot?: ReactNode;
};

export function EventFormTimeRange({
  startDate,
  endDate,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  stepMinutes = CREATE_EVENT_TIME_STEP_MINUTES,
  menuPlacement = "below",
  menuInPortal = false,
  menuPortalStack = "page",
  trailingSlot,
}: EventFormTimeRangeProps) {
  const options = useMemo(() => buildTimeOptions(stepMinutes), [stepMinutes]);
  const dropdownOptions = useMemo(
    () => options.map((o) => ({ value: o.value, label: o.label })),
    [options],
  );

  const handleStartChange = useCallback(
    (v: string) => {
      onStartTimeChange(v);
      if (startDate === endDate && hhmmToMinutes(endTime) <= hhmmToMinutes(v)) {
        const nextEnd = nextValidEndAfterStart(v, stepMinutes);
        onEndTimeChange(nextEnd);
      }
    },
    [
      startDate,
      endDate,
      endTime,
      onStartTimeChange,
      onEndTimeChange,
      stepMinutes,
    ],
  );

  const endOptions = useMemo(() => {
    if (startDate !== endDate) {
      return dropdownOptions;
    }
    const startM = hhmmToMinutes(startTime);
    return dropdownOptions.filter((o) => hhmmToMinutes(o.value) > startM);
  }, [dropdownOptions, startDate, endDate, startTime]);

  if (trailingSlot) {
    return (
      <Box className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2">
        <Label className="col-start-1 row-start-1 block text-sm font-medium text-gray-700">
          Start time
        </Label>
        <Label className="col-start-2 row-start-1 block text-sm font-medium text-gray-700">
          End time
        </Label>
        <Box className="col-start-3 row-start-1" aria-hidden />
        <Box className="col-start-1 row-start-2 min-w-0">
          <Dropdown<string>
            label="Start time"
            hideLabel
            options={dropdownOptions}
            value={startTime || undefined}
            onChange={handleStartChange}
            placeholder="Start"
            searchable
            variant="compact"
            size="md"
            required
            menuPlacement={menuPlacement}
            menuInPortal={menuInPortal}
            menuPortalStack={menuPortalStack}
          />
        </Box>
        <Box className="col-start-2 row-start-2 min-w-0">
          <Dropdown<string>
            label="End time"
            hideLabel
            options={endOptions.length > 0 ? endOptions : dropdownOptions}
            value={endTime || undefined}
            onChange={onEndTimeChange}
            placeholder="End"
            searchable
            variant="compact"
            size="md"
            required
            menuPlacement={menuPlacement}
            menuInPortal={menuInPortal}
            menuPortalStack={menuPortalStack}
          />
        </Box>
        <Box className="col-start-3 row-start-2 flex items-center self-center">
          {trailingSlot}
        </Box>
      </Box>
    );
  }

  return (
    <Box className="grid grid-cols-2 gap-3">
      <Dropdown<string>
        label="Start time"
        options={dropdownOptions}
        value={startTime || undefined}
        onChange={handleStartChange}
        placeholder="Start"
        searchable
        variant="compact"
        size="md"
        required
        menuPlacement={menuPlacement}
        menuInPortal={menuInPortal}
        menuPortalStack={menuPortalStack}
      />
      <Dropdown<string>
        label="End time"
        options={endOptions.length > 0 ? endOptions : dropdownOptions}
        value={endTime || undefined}
        onChange={onEndTimeChange}
        placeholder="End"
        searchable
        variant="compact"
        size="md"
        required
        menuPlacement={menuPlacement}
        menuInPortal={menuInPortal}
        menuPortalStack={menuPortalStack}
      />
    </Box>
  );
}
