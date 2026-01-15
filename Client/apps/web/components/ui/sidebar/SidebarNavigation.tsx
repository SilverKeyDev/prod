import Card from "../../layout/Card";
import type { NavItem } from "../../../../../packages/schemas/nav";
import { useResponsive } from "../../../../../packages/hooks/ui";

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
      className={`sticky top-[90px] h-fit shrink-0 ${className}`}
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
        {/* Header Content (e.g., Edit/Save buttons) */}
        {headerContent && (
          <div
            className={`${isLargeScreen ? "mb-8" : "mb-4"} ${
              isLargeScreen ? "w-full" : "flex justify-center"
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
            className={`group flex w-full items-center rounded-lg px-3 py-2 transition-colors ${
              isLargeScreen ? "gap-3" : "justify-center"
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
