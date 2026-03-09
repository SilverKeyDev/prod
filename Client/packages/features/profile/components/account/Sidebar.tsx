import { Icon } from "@ui/icons";

import { spacing } from "packages/design-tokens";
import { getPersonalizationNavItems } from "packages/features/profile/components/profilePicture/profileStepsUi";
import { useResponsive } from "packages/hooks/ui";
import type { NavItem } from "packages/navigation";
import type { IconName } from "packages/ui/types/icons";

import Card from "@/components/layout/Card.web";
import { BodyText, Button, CancelButton } from "@/components/ui";
const STEPS: NavItem[] = getPersonalizationNavItems();
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
  // This sidebar historically treated "mobile" as `< lg` (<=1024px). Preserve that intent.
  const { isLgUp } = useResponsive();
  const isLargeScreen = isLgUp;
  // Default to the first step when no active section is provided
  const currentActiveSection = activeSection || STEPS[0]?.key;
  return (
    <aside
      className="sticky top-24 h-fit shrink-0"
      style={{
        width: isLargeScreen ? spacing(64) : spacing(16),
      }}
    >
      <Card
        className={
          isLargeScreen
            ? "space-y-2"
            : "border-beige/30 space-y-2 rounded-lg border bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md"
        }
        padding={isLargeScreen ? "md" : "none"}
      >
        {/* Edit/Save Buttons - Full width on desktop, centered on mobile */}
        <div
          className={`${isLargeScreen ? "mb-8" : "mb-4"} ${isLargeScreen ? "w-full" : "flex justify-center"}`}
        >
          {!isEditMode ? (
            <Button
              onClick={onEdit}
              variant="primary"
              size="sm"
              className={`items-center justify-center rounded-lg p-2 text-sm font-medium ${isLargeScreen ? "w-full" : ""}`}
              icon={<Icon name="edit" />}
            >
              {isLargeScreen ? "Edit" : ""}
            </Button>
          ) : (
            <div
              className={`flex flex-col space-y-2 ${isLargeScreen ? "w-full" : "w-full items-center"}`}
            >
              <Button
                onClick={onSave}
                disabled={isSaving}
                variant="primary"
                size="sm"
                className={`items-center justify-center rounded-lg p-2 text-sm font-medium ${isLargeScreen ? "w-full" : ""}`}
                icon={<Icon name="save" />}
              >
                {isLargeScreen ? (isSaving ? "Saving..." : "Save") : ""}
              </Button>
              <CancelButton
                onClick={onCancel}
                size="sm"
                className={`items-center justify-center rounded-lg p-2 text-sm font-medium ${isLargeScreen ? "w-full" : ""}`}
              >
                {isLargeScreen ? "Cancel" : ""}
              </CancelButton>
            </div>
          )}
        </div>

        {/* Navigation Links - Left aligned on desktop, icon only on mobile */}
        {STEPS.map((step) => {
          const stepIconName = step.icon as IconName | undefined;
          return (
            <Button
              key={step.key}
              variant="ghost"
              size="sm"
              onClick={() => onScrollToSection(step.key)}
              className={`group flex w-full items-center rounded-lg px-3 py-2 transition-colors ${isLargeScreen ? "gap-3" : "justify-center"} ${
                currentActiveSection === step.key
                  ? "bg-gold text-off-white"
                  : "hover:bg-gold-lighter hover:text-off-white"
              }`}
              title={!isLargeScreen ? step.label : undefined}
            >
              {stepIconName && (
                <Icon
                  name={stepIconName}
                  size={20}
                  className={`flex-shrink-0 transition-colors ${
                    currentActiveSection === step.key
                      ? "text-off-white"
                      : "group-hover:text-off-white text-gray-500"
                  }`}
                />
              )}
              {isLargeScreen && (
                <BodyText
                  as="span"
                  size="sm"
                  className={`text-left font-medium transition-colors ${
                    currentActiveSection === step.key
                      ? "text-off-white"
                      : "group-hover:text-off-white text-gray-500"
                  }`}
                >
                  {step.label}
                </BodyText>
              )}
            </Button>
          );
        })}
      </Card>
    </aside>
  );
}
