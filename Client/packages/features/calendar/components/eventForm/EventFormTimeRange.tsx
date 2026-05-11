import { useCallback, useMemo } from "react";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { ReactNode } from "react";

import { Dropdown } from "packages/ui";
import { Box } from "packages/ui/components/primitives";
import Label from "packages/ui/components/text/Label.web";
import {
  CREATE_EVENT_TIME_STEP_MINUTES,
  parseHourMinute24,
} from "packages/utils/calendar/eventFormGooglePayload";
import { buildTimeOptions } from "packages/utils/scheduling/eventRequestScheduleOptions";

dayjs.extend(utc);
dayjs.extend(timezone);

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
  /** Opens option lists: below, above, or vertically centered on the trigger (e.g. modal). @default "below" */
  menuPlacement?: "below" | "above" | "overlap";
  /** Portals menus to document body so lists are not clipped by overflow containers. */
  menuInPortal?: boolean;
  /** Use `"modal"` when used inside a dialog so portaled menus stack above the modal. @default "page" */
  menuPortalStack?: "page" | "modal";
  /**
   * When time dropdowns use `menuInPortal`, register the portaled list root so parent
   * document-level outside-click handlers (e.g. quick event popover) ignore those clicks.
   */
  registerOutsideClickSafeTarget?: (element: HTMLElement) => () => void;
  /**
   * Optional control rendered in the same grid row as the time triggers (e.g. “All day”),
   * vertically centered with the dropdown buttons.
   */
  trailingSlot?: ReactNode;
  /** When set, menu rows are tinted for mutual free/busy + profile availability (create flow). */
  mutualTimeRange?: {
    hintsReady: boolean;
    enabled: boolean;
    viewerTimeZone: string;
    isMutualUtcRange: (startMs: number, endMs: number) => boolean;
  };
};

const MUTUAL_ROW = "bg-emerald-500/12";
const NOT_MUTUAL_ROW = "opacity-55";

export function EventFormTimeRange({
  startDate,
  endDate,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  stepMinutes = CREATE_EVENT_TIME_STEP_MINUTES,
  menuPlacement = "below",
  menuInPortal,
  menuPortalStack,
  registerOutsideClickSafeTarget,
  trailingSlot,
  mutualTimeRange,
}: EventFormTimeRangeProps) {
  const options = useMemo(() => buildTimeOptions(stepMinutes), [stepMinutes]);
  const baseDropdownOptions = useMemo(
    () => options.map((o) => ({ value: o.value, label: o.label })),
    [options]
  );

  const startDropdownOptions = useMemo(() => {
    const m = mutualTimeRange;
    const ymd = startDate?.trim() ?? "";
    if (!m?.enabled || !m.hintsReady || !ymd) {
      return baseDropdownOptions;
    }
    return baseDropdownOptions.map((o) => {
      const slotStart = dayjs.tz(`${ymd} ${o.value}`, "YYYY-MM-DD HH:mm", m.viewerTimeZone);
      if (!slotStart.isValid()) {
        return { ...o };
      }
      const slotEnd = slotStart.add(stepMinutes, "minute");
      const ok = m.isMutualUtcRange(slotStart.valueOf(), slotEnd.valueOf());
      return {
        ...o,
        menuRowClassName: ok ? MUTUAL_ROW : NOT_MUTUAL_ROW,
      };
    });
  }, [baseDropdownOptions, mutualTimeRange, startDate, stepMinutes]);

  const handleStartChange = useCallback(
    (v: string) => {
      onStartTimeChange(v);
      if (startDate === endDate && hhmmToMinutes(endTime) <= hhmmToMinutes(v)) {
        const nextEnd = nextValidEndAfterStart(v, stepMinutes);
        onEndTimeChange(nextEnd);
      }
    },
    [startDate, endDate, endTime, onStartTimeChange, onEndTimeChange, stepMinutes]
  );

  const endOptionsFiltered = useMemo(() => {
    if (startDate !== endDate) {
      return baseDropdownOptions;
    }
    const startM = hhmmToMinutes(startTime);
    return baseDropdownOptions.filter((o) => hhmmToMinutes(o.value) > startM);
  }, [baseDropdownOptions, startDate, endDate, startTime]);

  const endDropdownOptions = useMemo(() => {
    const m = mutualTimeRange;
    const lo = startDate?.trim() ?? "";
    const hi = endDate?.trim() ?? "";
    if (!m?.enabled || !m.hintsReady || lo !== hi || !lo) {
      return endOptionsFiltered;
    }
    const startMs = dayjs.tz(`${lo} ${startTime}`, "YYYY-MM-DD HH:mm", m.viewerTimeZone);
    if (!startMs.isValid()) {
      return endOptionsFiltered;
    }
    return endOptionsFiltered.map((o) => {
      const endMs = dayjs.tz(`${lo} ${o.value}`, "YYYY-MM-DD HH:mm", m.viewerTimeZone);
      if (!endMs.isValid()) {
        return { ...o };
      }
      const ok =
        endMs.valueOf() > startMs.valueOf() &&
        m.isMutualUtcRange(startMs.valueOf(), endMs.valueOf());
      return {
        ...o,
        menuRowClassName: ok ? MUTUAL_ROW : NOT_MUTUAL_ROW,
      };
    });
  }, [endOptionsFiltered, mutualTimeRange, startDate, endDate, startTime]);

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
            options={startDropdownOptions}
            value={startTime || undefined}
            onChange={handleStartChange}
            placeholder="Select start time"
            variant="compact"
            size="md"
            required
            menuPlacement={menuPlacement}
            menuInPortal={menuInPortal}
            menuPortalStack={menuPortalStack}
            registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
          />
        </Box>
        <Box className="col-start-2 row-start-2 min-w-0">
          <Dropdown<string>
            label="End time"
            hideLabel
            options={endDropdownOptions.length > 0 ? endDropdownOptions : startDropdownOptions}
            value={endTime || undefined}
            onChange={onEndTimeChange}
            placeholder="Select end time"
            variant="compact"
            size="md"
            required
            menuPlacement={menuPlacement}
            menuInPortal={menuInPortal}
            menuPortalStack={menuPortalStack}
            registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
          />
        </Box>
        <Box className="col-start-3 row-start-2 flex items-center self-center">{trailingSlot}</Box>
      </Box>
    );
  }

  return (
    <Box className="grid grid-cols-2 gap-3">
      <Dropdown<string>
        label="Start time"
        options={startDropdownOptions}
        value={startTime || undefined}
        onChange={handleStartChange}
        placeholder="Select start time"
        variant="compact"
        size="md"
        required
        menuPlacement={menuPlacement}
        menuInPortal={menuInPortal}
        menuPortalStack={menuPortalStack}
        registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
      />
      <Dropdown<string>
        label="End time"
        options={endDropdownOptions.length > 0 ? endDropdownOptions : startDropdownOptions}
        value={endTime || undefined}
        onChange={onEndTimeChange}
        placeholder="Select end time"
        variant="compact"
        size="md"
        required
        menuPlacement={menuPlacement}
        menuInPortal={menuInPortal}
        menuPortalStack={menuPortalStack}
        registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
      />
    </Box>
  );
}
