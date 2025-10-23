import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import React from "react";

import Loading from "../../components/ui/loading/Loading";

// Sortable Report Section Component
type SortableReportSectionProps = {
  id: string;
  label: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  priority?: number;
};

const SortableReportSection: React.FC<SortableReportSectionProps> = ({
  id,
  label,
  checked,
  onToggle,
  priority,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
  });

  // Safety checks for props
  if (
    (!id || !label) ??
    (typeof checked !== "boolean" || typeof onToggle !== "function")
  ) {
    console.warn("SortableReportSection received invalid props:", {
      id,
      label,
      checked,
      onToggle,
    });
    return null;
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    zIndex: isDragging ? 1000 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-2 rounded-lg border border-gray-300 bg-gray-50 p-2 ${
        !checked ? "opacity-60" : ""
      } ${isDragging ? "border-brown/50 bg-white shadow-lg" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-drag touch-manipulation select-none rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        title="Drag to reorder"
        style={{ touchAction: "none" }}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className="flex items-center space-x-2">
        {priority && (
          <span className="text-sm font-semibold text-gray-600">
            {priority}.
          </span>
        )}

        <label
          htmlFor={id}
          className="flex flex-1 cursor-pointer items-center space-x-3"
        >
          <div className="relative">
            <input
              type="checkbox"
              id={id}
              checked={checked}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onToggle(e.target.checked)
              }
              className="sr-only"
            />
            <div
              className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-all duration-200 ${
                checked
                  ? "border-olive bg-olive text-white shadow-sm"
                  : "border-gray-300 bg-gray-100"
              }`}
            >
              {checked && (
                <svg
                  className="h-2.5 w-2.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-gray-600">{label}</span>
        </label>
      </div>
    </div>
  );
};

// Main component interface
type OnPerDragDropPrioritiesProps = {
  isEditMode: boolean;
  isLoading?: boolean;
  orderedSections: Array<{ key: string; label: string }> | null;
  formData: {
    report_section_priorities?: string[];
  };
  onDragEnd: (event: DragEndEvent) => void;
  onToggle: (key: string, checked: boolean) => void;
};

const OnPerDragDropPriorities: React.FC<OnPerDragDropPrioritiesProps> = ({
  isEditMode,
  isLoading = false,
  orderedSections,
  formData,
  onDragEnd,
  onToggle,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading message="Loading report customization options..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="mb-4 font-serif text-lg text-black sm:text-xl">
        Priorities
      </h2>
      <p className="mb-3 text-sm text-gray-600">
        Section selection and order impacts your home-scoring algorithm and neighborhood reports
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={
            orderedSections?.map((section) => section?.key).filter(Boolean) ??
            []
          }
          strategy={verticalListSortingStrategy}
        >
          <div
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            style={{ touchAction: "manipulation" }}
          >
            {orderedSections?.map((section) => {
              if (!section?.key || !section.label) return null;

              const priorities = formData.report_section_priorities ?? [];
              const priorityIndex = priorities.indexOf(section.key);
              const isChecked = priorityIndex !== -1;
              const priority = isChecked ? priorityIndex + 1 : undefined;

              return isEditMode ? (
                <SortableReportSection
                  key={section.key}
                  id={section.key}
                  label={section.label}
                  checked={isChecked}
                  onToggle={(checked) => {
                    onToggle(section.key, checked);
                  }}
                  priority={priority}
                />
              ) : (
                <div
                  key={section.key}
                  className={`flex items-center space-x-2 rounded-lg border border-gray-300 bg-gray-50 p-2 ${
                    !isChecked ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {priority && (
                      <span className="text-sm font-semibold text-gray-600">
                        {priority}.
                      </span>
                    )}

                    <div className="relative">
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-all duration-200 ${
                          isChecked
                            ? "border-olive bg-olive text-white shadow-sm"
                            : "border-gray-300 bg-gray-100"
                        }`}
                      >
                        {isChecked && (
                          <svg
                            className="h-2.5 w-2.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>

                    <span className="text-sm text-gray-600">
                      {section.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default OnPerDragDropPriorities;
