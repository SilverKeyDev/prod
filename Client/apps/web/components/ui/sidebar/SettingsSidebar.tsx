import Button from "@ui/button/Button";
import CancelButton from "@ui/button/CancelButton";
import { Edit, Save } from "lucide-react";

import { useLocalization } from "packages/contexts";
import type { NavItem } from "packages/schemas/app/nav";

import SidebarNavigation from "./SidebarNavigation";

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
  const { t } = useLocalization();
  const headerContent = !isEditMode ? (
    <Button
      onClick={onEdit}
      variant="primary"
      size="sm"
      hideTextBelow="lg"
      className="text-sm font-medium rounded-lg items-center justify-center w-8 h-8 min-w-8 min-h-8 p-0 lg:w-full lg:h-auto lg:min-w-0 lg:min-h-0 lg:p-2"
      icon={<Edit />}
    >
      {t("common.edit")}
    </Button>
  ) : (
    <div className="flex flex-col items-center space-y-2 w-full">
      <Button
        onClick={onSave}
        disabled={isSaving}
        variant="primary"
        size="sm"
        hideTextBelow="lg"
        className="text-sm font-medium rounded-lg items-center justify-center w-8 h-8 min-w-8 min-h-8 p-0 lg:w-full lg:h-auto lg:min-w-0 lg:min-h-0 lg:p-2"
        icon={<Save />}
      >
        {isSaving ? t("common.saving") : t("common.save")}
      </Button>
      <CancelButton
        onClick={onCancel}
        size="sm"
        hideTextBelow="lg"
        className="text-sm font-medium rounded-lg items-center justify-center w-8 h-8 min-w-8 min-h-8 p-0 lg:w-full lg:h-auto lg:min-w-0 lg:min-h-0 lg:p-2"
      >
        {t("common.cancel")}
      </CancelButton>
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
