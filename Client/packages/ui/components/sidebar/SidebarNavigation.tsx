import Button from "@ui/button/Button";
import Card from "@ui/cards/Card";
import BodyText from "@ui/text/BodyText";
import Subtitle from "@ui/text/Subtitle";

import { spacing } from "packages/design-tokens";
import { useResponsive } from "packages/hooks/ui";
import type { NavItem } from "packages/navigation";
import { Box } from "packages/ui/components/primitives";
import {
  getInsetNavItemClasses,
  getInsetNavItemIconClasses,
  getInsetNavItemLabelClasses,
} from "packages/ui/components/sidebar/sidebarTheme";

type SidebarNavigationProps = {
  items: NavItem[];
  activeItem: string;
  onItemClick: (itemKey: string) => void;
  headerContent?: React.ReactNode;
  /** Optional section heading shown above nav items (e.g. "About you") */
  sectionTitle?: string;
  /** Optional footer below the nav links (e.g. help / product tour). */
  footerContent?: React.ReactNode;
  className?: string;
};

export default function SidebarNavigation({
  items,
  activeItem,
  onItemClick,
  headerContent,
  sectionTitle,
  footerContent,
  className = "",
}: SidebarNavigationProps) {
  // This component previously treated "mobile" as `< lg` (<=1024px). Preserve that
  // intent explicitly to avoid changing UX at ~tablet widths.
  const { isLgUp } = useResponsive();
  const isLargeScreen = isLgUp;
  // Default to the first item when no active item is provided
  const currentActiveItem = activeItem || items[0]?.key;

  return (
    <aside
      className={`sticky top-20 h-fit shrink-0 ${className}`}
      style={{
        width: isLargeScreen ? spacing(64) : spacing(14),
      }}
    >
      <Card
        border="light"
        className={`!bg-background-surface ${
          isLargeScreen ? "space-y-4" : "flex flex-col items-stretch space-y-2"
        }`}
        padding={isLargeScreen ? "md" : "none"}
        hover={false}
      >
        {/* Header section */}
        {headerContent && (
          <Card
            border="light"
            padding={isLargeScreen ? "sm" : "none"}
            hover={false}
            className={
              isLargeScreen ? "!bg-background-surface w-full" : "!bg-background-surface w-full"
            }
          >
            <Box
              className={`${isLargeScreen ? "" : "flex flex-col items-stretch p-3"} ${
                isLargeScreen ? "w-full" : "flex w-full flex-col items-stretch"
              }`}
            >
              {headerContent}
            </Box>
          </Card>
        )}

        {/* Nav section */}
        <Card
          border="light"
          padding={isLargeScreen ? "sm" : "none"}
          hover={false}
          className={
            isLargeScreen ? "!bg-background-surface w-full" : "!bg-background-surface w-full"
          }
        >
          <Box className={isLargeScreen ? "" : "p-3"}>
            {sectionTitle && (
              <Box className={`${isLargeScreen ? "mb-3" : "mb-2"} w-full`}>
                <Subtitle
                  size="xs"
                  className="text-text-secondary w-full text-left uppercase tracking-wide"
                >
                  {sectionTitle}
                </Subtitle>
              </Box>
            )}

            {/* Navigation Links — icon + label left-aligned; labels hidden below lg via children guard */}
            <nav className="flex flex-col gap-1" aria-label="Settings sections">
              {items.map((item) => {
                const isActive = currentActiveItem === item.key;
                const IconComponent = item.icon;
                return (
                  <Button
                    key={item.key}
                    type="button"
                    variant="ghost"
                    size="sm"
                    contentAlign="start"
                    onClick={() => onItemClick(item.key)}
                    disabled={item.disabled}
                    className={`${getInsetNavItemClasses({
                      active: isActive,
                      disabled: item.disabled,
                    })}`}
                    title={!isLargeScreen ? item.label : undefined}
                    icon={
                      IconComponent ? (
                        <IconComponent
                          size={20}
                          className={getInsetNavItemIconClasses(isActive)}
                        />
                      ) : undefined
                    }
                  >
                    {isLargeScreen && (
                      <BodyText
                        as="span"
                        className={getInsetNavItemLabelClasses(isActive)}
                      >
                        {item.label}
                      </BodyText>
                    )}
                  </Button>
                );
              })}
            </nav>
          </Box>
        </Card>

        {footerContent ? (
          <Card
            border="light"
            padding={isLargeScreen ? "sm" : "none"}
            hover={false}
            className="!bg-background-surface w-full"
          >
            <Box className={isLargeScreen ? "" : "p-3"}>{footerContent}</Box>
          </Card>
        ) : null}
      </Card>
    </aside>
  );
}
