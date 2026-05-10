import React, { useMemo } from "react";

import { Icon } from "@ui/icons";

import { spacing } from "packages/design-tokens";
import { getPersonalizationNavItems } from "packages/features/profile/components/profilePicture/profileStepsUi";
import { useIsAgent } from "packages/hooks/store/useIsAgent";
import { useResponsive } from "packages/hooks/ui";
import { Box } from "packages/ui/components/primitives";
import {
  getInsetNavItemClasses,
  getInsetNavItemIconClasses,
  getInsetNavItemLabelClasses,
} from "packages/ui/components/sidebar/sidebarTheme";
import type { IconName } from "packages/ui/types/icons";

import Card from "@/components/layout/Card.web";
import { BodyText, Button, CancelButton } from "@/components/ui";

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
  const isAgent = useIsAgent();
  const steps = useMemo(() => getPersonalizationNavItems({ isAgent }), [isAgent]);
  // This sidebar historically treated "mobile" as `< lg` (<=1024px). Preserve that intent.
  const { isLgUp } = useResponsive();
  const isLargeScreen = isLgUp;
  // Default to the first step when no active section is provided
  const currentActiveSection = activeSection || steps[0]?.key;
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
            : "!bg-background-surface flex flex-col items-center space-y-2 p-2 transition-all duration-200"
        }
        padding={isLargeScreen ? "md" : "none"}
      >
        {/* Edit/Save Buttons — hidden on mobile (handled by MobileTopBar) */}
        {isLargeScreen && (
          <Box className="mb-8 w-full">
            {!isEditMode ? (
              <Button
                onClick={onEdit}
                variant="primary"
                size="md"
                className="w-full focus:ring-0 focus:ring-offset-0"
                icon={<Icon name="edit" />}
              >
                Edit
              </Button>
            ) : (
              <Box className="flex w-full flex-col space-y-2">
                <Button
                  onClick={onSave}
                  disabled={isSaving}
                  variant="primary"
                  size="md"
                  className="w-full focus:ring-0 focus:ring-offset-0"
                  icon={<Icon name="save" />}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Card border="dotted" padding="sm" className="w-full">
                  <CancelButton
                    onClick={onCancel}
                    size="md"
                    className="w-full focus:ring-0 focus:ring-offset-0"
                  >
                    Cancel
                  </CancelButton>
                </Card>
              </Box>
            )}
          </Box>
        )}

        {/* Navigation Links — centered icons on mobile, left-aligned with labels on desktop */}
        {steps.map((step) => {
          const stepIconName = step.icon as IconName | undefined;
          return (
            <Button
              key={step.key}
              variant="ghost"
              size="sm"
              contentAlign={isLargeScreen ? "start" : "center"}
              onClick={() => onScrollToSection(step.key)}
              className={getInsetNavItemClasses({
                active: currentActiveSection === step.key,
                iconOnly: !isLargeScreen,
              })}
              title={!isLargeScreen ? step.label : undefined}
            >
              {stepIconName && (
                <Icon
                  name={stepIconName}
                  size={20}
                  className={getInsetNavItemIconClasses(currentActiveSection === step.key)}
                />
              )}
              {isLargeScreen && (
                <BodyText
                  as="span"
                  size="sm"
                  className={getInsetNavItemLabelClasses(currentActiveSection === step.key)}
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
