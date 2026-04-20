import React, { useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import type { LotSizeHomeAgeSearchOverridesPatch } from "packages/features/profile";
import { Box } from "packages/ui/components/primitives";

import { BodyText, Button } from "@/components/ui";
import type { OnboardingData } from "@/features/profile/utils";

import OtherFilterContent from "./OtherFilterContent.web";

export type OtherFilterDropdownProps = {
  formData: Partial<OnboardingData>;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  defaultOpen?: boolean;
  onSearchFilterOverridesPatch?: (patch: LotSizeHomeAgeSearchOverridesPatch) => void;
};
export default function OtherFilterDropdown({
  formData,
  updateFormData,
  defaultOpen = false,
  onSearchFilterOverridesPatch,
}: OtherFilterDropdownProps): React.ReactElement {
  const { t } = useLocalization();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Box>
      <Button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        variant="ghost"
        size="sm"
        fullWidth
        className="justify-between gap-2 rounded-lg py-1.5 text-left"
        aria-expanded={open}
        icon={
          open ? (
            <Icon name="chevron-down" className="text-text-secondary h-4 w-4 shrink-0" />
          ) : (
            <Icon name="chevron-right" className="text-text-secondary h-4 w-4 shrink-0" />
          )
        }
        iconPosition="right"
      >
        <BodyText as="span" size="sm" className="text-text-secondary font-medium">
          {t("search.other")}
        </BodyText>
      </Button>
      {open && (
        <Box className="mt-3 max-h-[60vh] overflow-y-auto pr-1">
          <OtherFilterContent
            formData={formData}
            updateFormData={updateFormData}
            menuInPortal
            onSearchFilterOverridesPatch={onSearchFilterOverridesPatch}
          />
        </Box>
      )}
    </Box>
  );
}
