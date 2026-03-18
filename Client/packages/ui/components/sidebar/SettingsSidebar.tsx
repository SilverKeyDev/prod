import Button from "@ui/button/Button";
import CancelButton from "@ui/button/CancelButton";
import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { NavItem } from "packages/navigation";
import { Box } from "packages/ui/components/primitives";

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
      size="md"
      fullWidth
      hideTextBelow="lg"
      label={t("common.edit")}
      icon={<Icon name="edit" />}
    >
      {t("common.edit")}
    </Button>
  ) : (
    <Box className="flex w-full flex-col items-center space-y-2">
      <Button
        onClick={onSave}
        disabled={isSaving}
        variant="primary"
        size="md"
        fullWidth
        hideTextBelow="lg"
        label={isSaving ? t("common.saving") : t("common.save")}
        icon={<Icon name="save" />}
      >
        {isSaving ? t("common.saving") : t("common.save")}
      </Button>
      <CancelButton
        onClick={onCancel}
        size="md"
        fullWidth
        hideTextBelow="lg"
        label={t("common.cancel")}
      >
        {t("common.cancel")}
      </CancelButton>
    </Box>
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
