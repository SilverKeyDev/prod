import { Edit, Save, X } from "lucide-react";

import Card from "../../../components/layout/Card";
import Button from "../../../components/ui/button/Button";
import type { NavItem } from "../../../../../packages/schemas/navigation";
import useMobile from "../../../../../packages/hooks/ui/useMobile";
import {
  getPersonalizationSteps,
  convertStepsToNavItems,
} from "../lib/constants";

const STEPS: NavItem[] = convertStepsToNavItems(getPersonalizationSteps());

type PersonalizationSidebarProps = {
  activeSection: string;
  isEditMode: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onScrollToSection: (sectionId: string) => void;
};

export default function PersonalizationSidebar({
  activeSection,
  isEditMode,
  isSaving,
  onEdit,
  onSave,
  onCancel,
  onScrollToSection,
}: PersonalizationSidebarProps) {
  const isMobile = useMobile(); // Uses "(max-width: 1024px)" by default
  const isLargeScreen = !isMobile;

  return (
    <aside
      className="sticky top-[90px] h-fit shrink-0"
      style={{
        width: isLargeScreen ? "16rem" : "4rem",
      }}
    >
      <Card
        className={
          isLargeScreen
            ? "space-y-2"
            : "space-y-2 rounded-lg border border-beige/30 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md"
        }
        padding={isLargeScreen ? "md" : "none"}
      >
        {/* Edit/Save Buttons - Full width on desktop, centered on mobile */}
        <div
          className={`${isLargeScreen ? "mb-8" : "mb-4"} ${
            isLargeScreen ? "w-full" : "flex justify-center"
          }`}
        >
          {!isEditMode ? (
            <Button
              onClick={onEdit}
              variant="olive"
              size="sm"
              className={`text-sm font-medium p-2 rounded-lg items-center justify-center ${
                isLargeScreen ? "w-full" : ""
              }`}
              icon={<Edit />}
            >
              {isLargeScreen ? "Edit" : ""}
            </Button>
          ) : (
            <div
              className={`flex flex-col space-y-2 ${
                isLargeScreen ? "w-full" : "items-center w-full"
              }`}
            >
              <Button
                onClick={onSave}
                disabled={isSaving}
                variant="olive"
                size="sm"
                className={`text-sm font-medium p-2 rounded-lg items-center justify-center ${
                  isLargeScreen ? "w-full" : ""
                }`}
                icon={<Save />}
                loading={isSaving}
              >
                {isLargeScreen ? (isSaving ? "Saving..." : "Save") : ""}
              </Button>
              <Button
                onClick={onCancel}
                variant="outline"
                size="sm"
                className={`bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-200 text-sm font-medium p-2 rounded-lg items-center justify-center ${
                  isLargeScreen ? "w-full" : ""
                }`}
                icon={<X />}
              >
                {isLargeScreen ? "Cancel" : ""}
              </Button>
            </div>
          )}
        </div>

        {/* Navigation Links - Left aligned on desktop, icon only on mobile */}
        {STEPS.map((step) => (
          <button
            key={step.key}
            onClick={() => onScrollToSection(step.key)}
            className={`group flex w-full items-center rounded-lg px-3 py-2 transition-colors ${
              isLargeScreen ? "gap-3" : "justify-center"
            } ${
              activeSection === step.key
                ? "bg-gold text-off-white"
                : "hover:bg-gold-lighter hover:text-off-white"
            }`}
            title={!isLargeScreen ? step.label : undefined}
          >
            {step.icon && (
              <step.icon
                size={20}
                className={`flex-shrink-0 transition-colors ${
                  activeSection === step.key
                    ? "text-off-white"
                    : "text-gray-500 group-hover:text-off-white"
                }`}
              />
            )}
            {isLargeScreen && (
              <span
                className={`text-left text-sm font-medium transition-colors ${
                  activeSection === step.key
                    ? "text-off-white"
                    : "text-gray-500 group-hover:text-off-white"
                }`}
              >
                {step.label}
              </span>
            )}
          </button>
        ))}
      </Card>
    </aside>
  );
}
