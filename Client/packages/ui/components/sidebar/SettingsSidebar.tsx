import Button from "@ui/button/Button";
import CancelButton from "@ui/button/CancelButton";
import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { NavItem } from "packages/navigation";

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
      label={t("common.edit")}
      className="h-8 min-h-8 w-8 min-w-8 items-center justify-center rounded-lg p-0 text-sm font-medium lg:h-auto lg:min-h-0 lg:w-full lg:min-w-0 lg:p-2"
      icon={<Icon name="edit" />}
    >
      {t("common.edit")}
    </Button>
  ) : (
    <div className="flex w-full flex-col items-center space-y-2">
      <Button
        onClick={onSave}
        disabled={isSaving}
        variant="primary"
        size="sm"
        hideTextBelow="lg"
        label={isSaving ? t("common.saving") : t("common.save")}
        className="h-8 min-h-8 w-8 min-w-8 items-center justify-center rounded-lg p-0 text-sm font-medium lg:h-auto lg:min-h-0 lg:w-full lg:min-w-0 lg:p-2"
        icon={<Icon name="save" />}
      >
        {isSaving ? t("common.saving") : t("common.save")}
      </Button>
      <CancelButton
        onClick={onCancel}
        size="sm"
        hideTextBelow="lg"
        label={t("common.cancel")}
        className="h-8 min-h-8 w-8 min-w-8 items-center justify-center rounded-lg p-0 text-sm font-medium lg:h-auto lg:min-h-0 lg:w-full lg:min-w-0 lg:p-2"
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
