/* eslint-disable silverkey/no-raw-spacing -- week grid event chip typography matches time column */
import { useCallback, useRef, useState } from "react";

import { color } from "packages/design-tokens";
import { Box, Text } from "packages/ui/components/structure/primitives";
import { quantizeMinutesFromMidnight } from "packages/utils/comms/calendar/createEvent/eventFormGooglePayload";
import { canResizeWeekTimedEvent } from "packages/utils/comms/calendar/grid/calendarWeekTimedEventResize";
import { getDocument } from "packages/utils/core/platform";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import {
  calendarColorForEvent,
  calendarEventChipStyle,
} from "@/features/calendar/utils/createEventModal/calendarEventColors";
import type { PlacedTimedEventSlice } from "@/features/calendar/utils/grid/calendarGridLayout";

import { CAL_TIME_GRID_EVENT_MIN_HEIGHT_FOR_TIME } from "./calendarTimeGridConstants";
import { formatCalendarSliceMinutesRange } from "./calendarTimeGridFormat";

const RESIZE_HANDLE_PX = 6;
const RESIZE_STEP = 15;

export type CalendarWeekTimedEventBlockProps = {
  row: PlacedTimedEventSlice;
  calendars: GoogleCalendar[];
  hourRowHeight: number;
  interactionEnabled: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onOpenEdit: () => void;
  onResizeCommit: (next: { startMin: number; endMin: number }) => void;
};

type DragMeta = {
  edge: "top" | "bottom";
  pointerId: number;
  originClientY: number;
  baselineStart: number;
  baselineEnd: number;
};

function liveRangeFromDrag(meta: DragMeta, clientY: number, hourRowHeight: number) {
  const deltaMin = ((clientY - meta.originClientY) / hourRowHeight) * 60;
  if (meta.edge === "top") {
    const nextStart = quantizeMinutesFromMidnight(meta.baselineStart + deltaMin, RESIZE_STEP);
    const startMin = Math.max(0, Math.min(nextStart, meta.baselineEnd - RESIZE_STEP));
    return { startMin, endMin: meta.baselineEnd };
  }
  const nextEnd = quantizeMinutesFromMidnight(meta.baselineEnd + deltaMin, RESIZE_STEP);
  const endMin = Math.min(24 * 60 - 1, Math.max(nextEnd, meta.baselineStart + RESIZE_STEP));
  return { startMin: meta.baselineStart, endMin };
}

export function CalendarWeekTimedEventBlock({
  row,
  calendars,
  hourRowHeight,
  interactionEnabled,
  isSelected,
  onSelect,
  onOpenEdit,
  onResizeCommit,
}: CalendarWeekTimedEventBlockProps) {
  const ev = row.event as ExtendedGoogleEvent;
  const isDraft = Boolean(ev.isOptimisticCalendarDraft);
  const allowResize = interactionEnabled && !isDraft && canResizeWeekTimedEvent(ev);
  const metaRef = useRef<DragMeta | null>(null);
  const [liveRange, setLiveRange] = useState<null | { startMin: number; endMin: number }>(null);
  const rowBaselineRef = useRef({ start: row.startMin, end: row.endMin });
  rowBaselineRef.current = { start: row.startMin, end: row.endMin };

  const startMin = liveRange?.startMin ?? row.startMin;
  const endMin = liveRange?.endMin ?? row.endMin;

  const top = (startMin / 60) * hourRowHeight;
  const h = Math.max(8, ((endMin - startMin) / 60) * hourRowHeight);
  const laneW = 100 / row.laneCount;
  const leftPct = row.laneIndex * laneW;
  const evColor = calendarColorForEvent(row.event, calendars);
  const showTime = h >= CAL_TIME_GRID_EVENT_MIN_HEIGHT_FOR_TIME;
  const showAccentOutline = Boolean(isSelected || liveRange);

  const startResize = useCallback(
    (edge: "top" | "bottom", e: React.PointerEvent) => {
      if (!allowResize) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const doc = getDocument();
      if (!doc) {
        return;
      }
      const baseline = rowBaselineRef.current;
      const meta: DragMeta = {
        edge,
        pointerId: e.pointerId,
        originClientY: e.clientY,
        baselineStart: baseline.start,
        baselineEnd: baseline.end,
      };
      metaRef.current = meta;
      setLiveRange(liveRangeFromDrag(meta, e.clientY, hourRowHeight));

      const onMove = (ev: PointerEvent) => {
        const m = metaRef.current;
        if (!m || ev.pointerId !== m.pointerId) {
          return;
        }
        setLiveRange(liveRangeFromDrag(m, ev.clientY, hourRowHeight));
      };

      const onUp = (ev: PointerEvent) => {
        const m = metaRef.current;
        if (!m || ev.pointerId !== m.pointerId) {
          return;
        }
        doc.removeEventListener("pointermove", onMove);
        doc.removeEventListener("pointerup", onUp);
        doc.removeEventListener("pointercancel", onUp);
        const fin = liveRangeFromDrag(m, ev.clientY, hourRowHeight);
        metaRef.current = null;
        setLiveRange(null);
        const base = rowBaselineRef.current;
        if (fin.startMin !== base.start || fin.endMin !== base.end) {
          onResizeCommit(fin);
        }
      };

      doc.addEventListener("pointermove", onMove);
      doc.addEventListener("pointerup", onUp);
      doc.addEventListener("pointercancel", onUp);
    },
    [allowResize, hourRowHeight, onResizeCommit]
  );

  return (
    <Box
      data-calendar-week-event=""
      {...(row.event.id != null && String(row.event.id).length > 0
        ? { "data-calendar-week-event-id": String(row.event.id) }
        : {})}
      style={{
        position: "absolute" as const,
        top,
        height: h,
        left: `${leftPct + 1}%`,
        width: `${laneW - 2}%`,
        borderRadius: 4,
        overflow: "hidden",
        ...calendarEventChipStyle(evColor),
        paddingHorizontal: 4,
        paddingVertical: 2,
        zIndex: 1,
        cursor: interactionEnabled && !isDraft ? "pointer" : undefined,
        ...(isDraft
          ? {
              outlineWidth: 2,
              outlineStyle: "dashed" as const,
              outlineColor: evColor,
              outlineOffset: -2,
              opacity: 0.72,
            }
          : null),
        ...(showAccentOutline
          ? {
              outlineWidth: 2,
              outlineStyle: "solid" as const,
              outlineColor: color("brand-accent"),
              outlineOffset: -2,
            }
          : null),
      }}
      onClick={(e) => {
        if (!interactionEnabled || isDraft) {
          return;
        }
        e.stopPropagation();
        onSelect();
        onOpenEdit();
      }}
    >
      {allowResize ? (
        <Box
          onPointerDown={(e) => startResize("top", e)}
          style={{
            position: "absolute" as const,
            left: 0,
            right: 0,
            top: 0,
            height: RESIZE_HANDLE_PX,
            zIndex: 3,
            cursor: "ns-resize" as const,
          }}
        />
      ) : null}
      {allowResize ? (
        <Box
          onPointerDown={(e) => startResize("bottom", e)}
          style={{
            position: "absolute" as const,
            left: 0,
            right: 0,
            bottom: 0,
            height: RESIZE_HANDLE_PX,
            zIndex: 3,
            cursor: "ns-resize" as const,
          }}
        />
      ) : null}
      <Box style={{ flex: 1, pointerEvents: "box-none" as const }}>
        <Text
          style={{
            fontSize: 10,
            fontWeight: "700",
            color: color("neutral.900"),
          }}
          numberOfLines={showTime ? 2 : 1}
        >
          {row.event.summary || "Untitled"}
        </Text>
        {showTime ? (
          <Text
            style={{
              fontSize: 9,
              color: color("neutral.600"),
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {formatCalendarSliceMinutesRange(startMin, endMin)}
          </Text>
        ) : null}
      </Box>
    </Box>
  );
}
