import Button from "@ui/button/Button";
import Card from "@ui/cards/Card";
import BodyText from "@ui/text/BodyText";
import Subtitle from "@ui/text/Subtitle";

import { spacing } from "packages/design-tokens";
import { useResponsive } from "packages/hooks/ui";
import type { NavItem } from "packages/navigation";

type SidebarNavigationProps = {
  items: NavItem[];
  activeItem: string;
  onItemClick: (itemKey: string) => void;
  headerContent?: React.ReactNode;
  /** Optional section heading shown above nav items (e.g. "About you") */
  sectionTitle?: string;
  className?: string;
};

export default function SidebarNavigation({
  items,
  activeItem,
  onItemClick,
  headerContent,
  sectionTitle,
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
        className={`!bg-background-surface ${isLargeScreen ? "space-y-4" : "flex flex-col items-center space-y-2"}`}
        padding={isLargeScreen ? "md" : "none"}
        hover={false}
      >
        {/* Header section */}
        {headerContent && (
          <Card
            padding={isLargeScreen ? "sm" : "none"}
            hover={false}
            className={
              isLargeScreen ? "!bg-background-surface w-full" : "!bg-background-surface w-full"
            }
          >
            <div
              className={`${isLargeScreen ? "" : "flex flex-col items-center p-3"} ${
                isLargeScreen ? "w-full" : "flex w-full flex-col items-center"
              }`}
            >
              {headerContent}
            </div>
          </Card>
        )}

        {/* Nav section */}
        <Card
          padding={isLargeScreen ? "sm" : "none"}
          hover={false}
          className={
            isLargeScreen ? "!bg-background-surface w-full" : "!bg-background-surface w-full"
          }
        >
          <div className={isLargeScreen ? "" : "p-3"}>
            {sectionTitle && (
              <div className={isLargeScreen ? "mb-3" : "mb-2"}>
                <Subtitle size="xs" className="text-text-secondary uppercase tracking-wide">
                  {sectionTitle}
                </Subtitle>
              </div>
            )}

            {/* Navigation Links - Left aligned on desktop, icon only on mobile; uniform styling for all items */}
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
                    onClick={() => onItemClick(item.key)}
                    disabled={item.disabled}
                    className={`group flex min-h-9 items-center rounded-lg transition-colors ${
                      isLargeScreen
                        ? "w-full gap-3 px-3 py-2"
                        : "h-9 min-h-9 w-9 min-w-9 justify-center p-0"
                    } ${
                      isActive
                        ? "!bg-neutral-100 !text-neutral-800 hover:!bg-neutral-100 hover:font-semibold hover:!text-neutral-800 active:!bg-neutral-100 active:font-semibold active:!text-neutral-800"
                        : "text-neutral-700 hover:!bg-neutral-100 hover:text-neutral-800 active:!bg-neutral-100 active:text-neutral-800"
                    } ${item.disabled ? "bg-disabled text-text-disabled cursor-not-allowed" : ""}`}
                    title={!isLargeScreen ? item.label : undefined}
                    icon={
                      IconComponent ? (
                        <IconComponent
                          size={20}
                          className={`size-5 flex-shrink-0 transition-colors ${
                            isActive
                              ? "!text-neutral-800 group-hover:!text-neutral-800"
                              : "text-neutral-600 group-hover:text-neutral-800"
                          }`}
                        />
                      ) : undefined
                    }
                  >
                    {isLargeScreen && (
                      <BodyText
                        as="span"
                        className={`text-left text-sm font-medium transition-colors ${
                          isActive
                            ? "!text-neutral-800 group-hover:!font-semibold group-hover:!text-neutral-800"
                            : "text-neutral-600 group-hover:text-neutral-800"
                        }`}
                      >
                        {item.label}
                      </BodyText>
                    )}
                  </Button>
                );
              })}
            </nav>
          </div>
        </Card>
      </Card>
    </aside>
  );
}
