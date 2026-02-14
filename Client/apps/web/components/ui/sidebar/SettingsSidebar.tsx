import { Edit, Save, X } from "lucide-react";
import Button from "../button/Button";
import SidebarNavigation from "./SidebarNavigation";
import type { NavItem } from "../../../../../packages/schemas/nav";

type SettingsSidebarProps = {
  items: NavItem[];
  activeSection: string;
  isEditMode: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onScrollToSection: (sectionId: string) => void;
};

export default function SettingsSidebar({
  items,
  activeSection,
  isEditMode,
  isSaving,
  onEdit,
  onSave,
  onCancel,
  onScrollToSection,
}: SettingsSidebarProps) {
  const headerContent = !isEditMode ? (
    <Button
      onClick={onEdit}
      variant="olive"
      size="sm"
      hideTextBelow="lg"
      className="text-sm font-medium rounded-lg items-center justify-center w-8 h-8 min-w-8 min-h-8 p-0 lg:w-full lg:h-auto lg:min-w-0 lg:min-h-0 lg:p-2"
      icon={<Edit />}
    >
      Edit
    </Button>
  ) : (
    <div className="flex flex-col items-center space-y-2 w-full">
      <Button
        onClick={onSave}
        disabled={isSaving}
        variant="olive"
        size="sm"
        hideTextBelow="lg"
        className="text-sm font-medium rounded-lg items-center justify-center w-8 h-8 min-w-8 min-h-8 p-0 lg:w-full lg:h-auto lg:min-w-0 lg:min-h-0 lg:p-2"
        icon={<Save />}
      >
        {isSaving ? "Saving..." : "Save"}
      </Button>
      <Button
        onClick={onCancel}
        variant="outline"
        size="sm"
        hideTextBelow="lg"
        className="bg-gray-200 text-gray-700 hover:bg-gray-300 border-gray-200 text-sm font-medium rounded-lg items-center justify-center w-8 h-8 min-w-8 min-h-8 p-0 lg:w-full lg:h-auto lg:min-w-0 lg:min-h-0 lg:p-2"
        icon={<X />}
      >
        Cancel
      </Button>
    </div>
  );

  return (
    <SidebarNavigation
      items={items}
      activeItem={activeSection}
      onItemClick={onScrollToSection}
      headerContent={headerContent}
    />
  );
}
