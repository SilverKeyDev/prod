import { Icon } from "@ui/icons";

import { spacing } from "packages/design-tokens";
import { getPersonalizationNavItems } from "packages/features/profile/components/profilePicture/profileStepsUi";
import { useResponsive } from "packages/hooks/ui";
import type { NavItem } from "packages/navigation";
import { Box } from "packages/ui/components/primitives";
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
        border="charcoal"
        className={
          isLargeScreen
            ? "!bg-background-surface space-y-2"
            : "!bg-background-surface space-y-2 p-3 transition-all duration-200"
        }
        padding={isLargeScreen ? "md" : "none"}
      >
        {/* Edit/Save Buttons - Full width on desktop, centered on mobile */}
        <Box
          className={`${isLargeScreen ? "mb-8" : "mb-4"} ${isLargeScreen ? "w-full" : "flex justify-center"}`}
        >
          {!isEditMode ? (
            <Button
              onClick={onEdit}
              variant="primary"
              size="md"
              className={`focus:ring-0 focus:ring-offset-0 ${isLargeScreen ? "w-full" : ""}`}
              icon={<Icon name="edit" />}
            >
              {isLargeScreen ? "Edit" : ""}
            </Button>
          ) : (
            <Box
              className={`flex flex-col space-y-2 ${isLargeScreen ? "w-full" : "w-full items-center"}`}
            >
              <Button
                onClick={onSave}
                disabled={isSaving}
                variant="primary"
                size="md"
                className={`focus:ring-0 focus:ring-offset-0 ${isLargeScreen ? "w-full" : ""}`}
                icon={<Icon name="save" />}
              >
                {isLargeScreen ? (isSaving ? "Saving..." : "Save") : ""}
              </Button>
              <Card border="dotted" padding="sm" className="w-full">
                <CancelButton
                  onClick={onCancel}
                  size="md"
                  className={`focus:ring-0 focus:ring-offset-0 ${isLargeScreen ? "w-full" : ""}`}
                >
                  {isLargeScreen ? "Cancel" : ""}
                </CancelButton>
              </Card>
            </Box>
          )}
        </Box>

        {/* Navigation Links - Left aligned on desktop, icon only on mobile */}
        {STEPS.map((step) => {
          const stepIconName = step.icon as IconName | undefined;
          return (
            <Button
              key={step.key}
              variant="ghost"
              size="sm"
              onClick={() => onScrollToSection(step.key)}
              className={`group flex min-h-9 w-full items-center justify-center rounded-lg px-3 py-2 transition-colors ${isLargeScreen ? "justify-start gap-3" : "justify-center"} ${
                currentActiveSection === step.key
                  ? "bg-neutral-100 text-neutral-800"
                  : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-800"
              }`}
              title={!isLargeScreen ? step.label : undefined}
            >
              {stepIconName && (
                <Icon
                  name={stepIconName}
                  size={20}
                  className={`flex-shrink-0 transition-colors ${
                    currentActiveSection === step.key
                      ? "text-neutral-800"
                      : "text-neutral-600 group-hover:text-neutral-800"
                  }`}
                />
              )}
              {isLargeScreen && (
                <BodyText
                  as="span"
                  size="sm"
                  className={`text-left font-medium transition-colors ${
                    currentActiveSection === step.key
                      ? "text-neutral-800"
                      : "text-neutral-600 group-hover:text-neutral-800"
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
