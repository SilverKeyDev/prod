import { spacing } from "packages/design-tokens";
import { useResponsive } from "packages/hooks/ui";
import type { NavItem } from "packages/schemas/app/nav";

import Card from "@/components/layout/Card.web";

type SidebarNavigationProps = {
  items: NavItem[];
  activeItem: string;
  onItemClick: (itemKey: string) => void;
  headerContent?: React.ReactNode;
  className?: string;
};

export default function SidebarNavigation({
  items,
  activeItem,
  onItemClick,
  headerContent,
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
        className={
          isLargeScreen
            ? "space-y-2"
            : "flex flex-col items-center space-y-2 rounded-lg border border-beige/30 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md"
        }
        padding={isLargeScreen ? "md" : "none"}
      >
        {/* Header Content (e.g., Edit/Save buttons) */}
        {headerContent && (
          <div
            className={`${isLargeScreen ? "mb-8" : "mb-4"} ${
              isLargeScreen ? "w-full" : "flex flex-col items-center w-full"
            }`}
          >
            {headerContent}
          </div>
        )}

        {/* Navigation Links - Left aligned on desktop, icon only on mobile */}
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onItemClick(item.key)}
            disabled={item.disabled}
            className={`group flex items-center rounded-lg transition-colors ${
              isLargeScreen
                ? "w-full gap-3 px-3 py-2"
                : "w-8 h-8 min-w-8 p-0 justify-center"
            } ${
              currentActiveItem === item.key
                ? "bg-gold text-off-white"
                : "hover:bg-gold-lighter hover:text-off-white"
            } ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            title={!isLargeScreen ? item.label : undefined}
          >
            {item.icon && (
              <item.icon
                size={20}
                className={`flex-shrink-0 transition-colors ${
                  currentActiveItem === item.key
                    ? "text-off-white"
                    : "text-gray-500 group-hover:text-off-white"
                }`}
              />
            )}
            {isLargeScreen && (
              <span
                className={`text-left text-sm font-medium transition-colors ${
                  currentActiveItem === item.key
                    ? "text-off-white"
                    : "text-gray-500 group-hover:text-off-white"
                }`}
              >
                {item.label}
              </span>
            )}
          </button>
        ))}
      </Card>
    </aside>
  );
}
