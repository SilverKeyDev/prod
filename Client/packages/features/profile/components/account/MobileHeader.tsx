import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { Button, CancelButton } from "packages/ui";
import { Box } from "packages/ui/components/primitives";

type PersonalizationMobileHeaderProps = {
  isEditMode: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
};
const PersonalizationMobileHeader: React.FC<PersonalizationMobileHeaderProps> = ({
  isEditMode,
  isSaving,
  onEdit,
  onCancel,
  onSave,
}) => {
  const { t } = useLocalization();
  if (!isEditMode) {
    return (
      <Box className="flex w-full justify-center px-4">
        <Button
          onClick={onEdit}
          variant="primary"
          size="sm"
          fullWidth
          className="max-w-sm"
          icon={<Icon name="edit" />}
        >
          {t("profile.account.edit")}
        </Button>
      </Box>
    );
  }
  return (
    <Box className="mx-auto flex w-full max-w-sm gap-2">
      <CancelButton onClick={onCancel} size="sm" className="flex-1">
        {t("profile.account.cancel")}
      </CancelButton>
      <Button
        onClick={onSave}
        disabled={isSaving}
        variant="primary"
        size="sm"
        className="flex-1"
        icon={<Icon name="save" />}
      >
        {isSaving ? t("profile.account.saving_save") : t("profile.account.save")}
      </Button>
    </Box>
  );
};
export default PersonalizationMobileHeader;
