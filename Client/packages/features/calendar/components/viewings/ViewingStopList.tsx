import { useMemo } from "react";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import Button from "packages/ui/components/button/Button";
import { AddressInput } from "packages/ui/components/form/AddressInput";
import { Icon } from "packages/ui/components/icons";
import { Box, Pressable } from "packages/ui/components/primitives";
import BodyText from "packages/ui/components/text/BodyText";

import { Title } from "@/components/ui";
import {
  estimateViewingItineraryMinutes,
  formatMinutesHuman,
} from "@/features/calendar/utils/agenda/estimateViewingItineraryDuration";

import type { ViewingStop, ViewingStopListProps } from "./viewingItineraryTypes";
import { useViewingStopRowIds } from "./viewingStopListIds";

export type { ViewingItinerary, ViewingStop, ViewingStopListProps } from "./viewingItineraryTypes";

function emptyStop(): ViewingStop {
  return {
    address: "",
    label: null,
    lat: null,
    lng: null,
    notes: null,
    listing_id: null,
  };
}

type SortableStopRowProps = {
  id: string;
  index: number;
  stop: ViewingStop;
  scriptsReady: boolean;
  onRemove: () => void;
  onPatch: (patch: Partial<ViewingStop>) => void;
};

function SortableStopRow({
  id,
  index,
  stop,
  scriptsReady,
  onRemove,
  onPatch,
}: SortableStopRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      className={`border-border space-y-2 rounded-lg border p-3 ${isDragging ? "shadow-md opacity-95 ring-2 ring-neutral-300" : ""}`}
    >
      <Box className="flex flex-wrap items-center gap-2">
        <Pressable
          type="button"
          className="text-text-secondary hover:text-text-primary inline-flex shrink-0 cursor-grab touch-none rounded-md p-1 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          label={`Drag to reorder stop ${index + 1}`}
        >
          <Icon name="grip-vertical" className="h-4 w-4 shrink-0" aria-hidden />
        </Pressable>
        <BodyText size="xs" className="text-text-secondary font-medium">
          Stop {index + 1}
        </BodyText>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive min-h-0 px-2 py-0"
          onClick={onRemove}
          iconName="trash-2"
        >
          Remove
        </Button>
      </Box>
      <AddressInput
        label="Address"
        value={stop.address}
        onChange={(v) => onPatch({ address: v, lat: null, lng: null })}
        onSelect={(data) =>
          onPatch({
            address: data.address,
            label: data.street ?? data.address,
            lat: data.lat ?? null,
            lng: data.lng ?? null,
          })
        }
        scriptsReady={scriptsReady ?? false}
        placeholder="Search or type an address"
      />
    </Box>
  );
}

export function ViewingStopList({
  stops,
  onStopsChange,
  scriptsReady,
  loadError,
}: ViewingStopListProps) {
  const { ids, removeIdAt, appendId, reorderIds } = useViewingStopRowIds(stops.length);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addStop = () => {
    appendId();
    onStopsChange([...stops, emptyStop()]);
  };

  const removeStop = (index: number) => {
    removeIdAt(index);
    const next = stops.filter((_, i) => i !== index);
    onStopsChange(next.length ? next : [emptyStop()]);
  };

  const updateStop = (index: number, patch: Partial<ViewingStop>) => {
    const next = stops.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onStopsChange(next);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    reorderIds(oldIndex, newIndex);
    onStopsChange(arrayMove(stops, oldIndex, newIndex));
  };

  const durationEstimateLine = useMemo(() => {
    const est = estimateViewingItineraryMinutes({
      stops,
      legs: null,
    });
    if (!est) {
      return null;
    }
    return `Est. ${formatMinutesHuman(est.onSiteMinutes)} on-site (${
      est.minutesPerProperty
    } min avg × ${est.stopCount} tours). Fastest drive route is computed when you save.`;
  }, [stops]);

  return (
    <Box className="space-y-3">
      <Title size="sm" as="h3">
        Viewing stops
      </Title>
      <BodyText size="xs" muted>
        Add addresses for each stop. Drag the grip handle to reorder. Pick places from search to
        capture map coordinates, or type an address (we geocode on save when building the route).
      </BodyText>

      {stops.length === 0 ? (
        <Button type="button" variant="outline" size="sm" onClick={addStop} iconName="plus">
          Add stop
        </Button>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <Box className="space-y-3">
              {stops.map((stop, index) => (
                <SortableStopRow
                  key={ids[index]}
                  id={ids[index]!}
                  index={index}
                  stop={stop}
                  scriptsReady={scriptsReady ?? false}
                  onRemove={() => removeStop(index)}
                  onPatch={(patch) => updateStop(index, patch)}
                />
              ))}
            </Box>
          </SortableContext>
        </DndContext>
      )}

      {durationEstimateLine ? (
        <BodyText
          size="xs"
          className="text-text-secondary border-border bg-accent-muted rounded-lg border px-3 py-2"
        >
          {durationEstimateLine}
        </BodyText>
      ) : null}

      {loadError ? (
        <BodyText size="xs" className="text-destructive">
          {loadError}
        </BodyText>
      ) : null}

      {stops.length > 0 ? (
        <Button type="button" variant="outline" size="sm" onClick={addStop} iconName="plus">
          Add stop
        </Button>
      ) : null}
    </Box>
  );
}
