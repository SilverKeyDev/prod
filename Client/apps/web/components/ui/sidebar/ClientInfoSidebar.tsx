import SidebarNavigation from "./SidebarNavigation";
import type { NavItem } from "../../../../../packages/schemas/nav";

type ClientInfoSidebarProps = {
  items: NavItem[];
  activeSection: string;
  onScrollToSection: (sectionId: string) => void;
};

export default function ClientInfoSidebar({
  items,
  activeSection,
  onScrollToSection,
}: ClientInfoSidebarProps) {
  return (
    <SidebarNavigation
      items={items}
      activeItem={activeSection}
      onItemClick={onScrollToSection}
    />
  );
}
