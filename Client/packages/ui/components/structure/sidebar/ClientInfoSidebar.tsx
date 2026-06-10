import type { NavItem } from "packages/navigation";

import SidebarNavigation from "./SidebarNavigation";

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
    <SidebarNavigation items={items} activeItem={activeSection} onItemClick={onScrollToSection} />
  );
}
