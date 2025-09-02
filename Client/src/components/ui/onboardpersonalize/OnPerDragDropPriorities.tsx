import React from "react";
import { GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Loading from "../base/Loading";

// Sortable Report Section Component
interface SortableReportSectionProps {
  id: string;
  label: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  priority?: number;
}

const SortableReportSection: React.FC<SortableReportSectionProps> = ({
  id,
  label,
  checked,
  onToggle,
  priority,
}) => {
  // Safety checks for props
  if (
    !id ||
    !label ||
    typeof checked !== "boolean" ||
    typeof onToggle !== "function"
  ) {
    console.warn("SortableReportSection received invalid props:", {
      id,
      label,
      checked,
      onToggle,
    });
    return null;
  }

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
    transition: isDragging ? "none" : transition,
    zIndex: isDragging ? 1000 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-2 p-2 bg-gray-50 border border-gray-300 rounded-lg ${
        !checked ? "opacity-60" : ""
      } ${isDragging ? "shadow-lg bg-white border-brown/50" : ""}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-drag text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors touch-manipulation select-none"
        title="Drag to reorder"
        style={{ touchAction: 'none' }}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex items-center space-x-2">
        {priority && (
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            {priority}
          </span>
        )}

        <label
          htmlFor={id}
          className="flex items-center space-x-2 cursor-pointer flex-1"
        >
          <div className="relative">
            <input
              type="checkbox"
              id={id}
              checked={checked}
              onChange={(e) => onToggle(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                checked
                  ? "bg-brown border-brown text-white shadow-sm"
                  : "border-gray-300 bg-gray-100"
              }`}
            >
              {checked && (
                <svg
                  className="w-2.5 h-2.5"
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
          <span className="text-xs font-medium text-gray-700 flex-1">
            {label}
          </span>
        </label>
      </div>
    </div>
  );
};

// Main component interface
interface OnPerDragDropPrioritiesProps {
  isEditMode: boolean;
  isLoading?: boolean;
  orderedSections: Array<{ key: string; label: string }> | null;
  formData: {
    report_section_priorities?: string[];
  };
  onDragEnd: (event: DragEndEvent) => void;
  onToggle: (key: string, checked: boolean) => void;
}

const OnPerDragDropPriorities: React.FC<
  OnPerDragDropPrioritiesProps
> = ({
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
    })
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loading message="Loading report customization options..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg sm:text-xl font-serif text-black mb-4">
        Priorities
      </h2>
      <p className="text-sm text-gray-600 mb-3">
        {isEditMode
          ? "Customize your report sections below:"
          : "Choose which sections to include in your property reports. All sections are enabled by default, but you can customize them to focus on what matters most to you."}
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={
            orderedSections?.map((section) => section?.key).filter(Boolean) ||
            []
          }
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" style={{ touchAction: 'manipulation' }}>
            {orderedSections?.map((section) => {
              if (!section || !section.key || !section.label) return null;

              const priorities = formData.report_section_priorities || [];
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
                  className={`flex items-center space-x-2 p-2 bg-gray-50 border border-gray-300 rounded-lg ${
                    !isChecked ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {priority && (
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {priority}
                      </span>
                    )}

                    <div className="relative">
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                          isChecked
                            ? "bg-brown border-brown text-white shadow-sm"
                            : "border-gray-300 bg-gray-100"
                        }`}
                      >
                        {isChecked && (
                          <svg
                            className="w-2.5 h-2.5"
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
                    <span className="text-xs font-medium text-gray-700 flex-1">
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
