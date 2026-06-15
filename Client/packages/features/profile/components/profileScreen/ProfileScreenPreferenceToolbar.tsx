import React from "react";

import { useLocalization } from "packages/contexts";
import { Button, CancelButton } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";

export type ProfileScreenPreferenceToolbarProps = {
  isEditMode: boolean;
  loading: boolean;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
};

export function ProfileScreenPreferenceToolbar({
  isEditMode,
  loading,
  onStartEdit,
  onCancel,
  onSave,
}: ProfileScreenPreferenceToolbarProps) {
  const { t } = useLocalization();

  return (
    <Box className="flex-row gap-3">
      {isEditMode ? (
        <>
          <CancelButton onPress={onCancel} disabled={loading} size="sm" className="flex-1">
            {t("profile.account.cancel")}
          </CancelButton>
          <Button
            onPress={onSave}
            disabled={loading}
            loading={loading}
            variant="primary"
            size="sm"
            iconName="save"
            className="flex-1"
          >
            {t("profile.account.save")}
          </Button>
        </>
      ) : (
        <Button
          onPress={onStartEdit}
          variant="primary"
          size="sm"
          iconName="edit"
          className="self-start"
        >
          {t("profile.account.edit")}
        </Button>
      )}
    </Box>
  );
}
