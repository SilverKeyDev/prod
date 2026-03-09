import React, { useState } from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";

import { BodyText, Button } from "@/components/ui";
import type { OnboardingData } from "@/features/profile/utils";

import OtherFilterContent from "./OtherFilterContent.web";
export type OtherFilterDropdownProps = {
  formData: Partial<OnboardingData>;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  defaultOpen?: boolean;
};
export default function OtherFilterDropdown({
  formData,
  updateFormData,
  defaultOpen = false,
}: OtherFilterDropdownProps): React.ReactElement {
  const { t } = useLocalization();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-200 pt-3">
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
            <Icon name="chevron-down" className="h-4 w-4 shrink-0 text-gray-500" />
          ) : (
            <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-gray-500" />
          )
        }
        iconPosition="right"
      >
        <BodyText as="span" size="sm" className="font-medium text-gray-700">
          {t("search.other")}
        </BodyText>
      </Button>
      {open && (
        <div className="mt-3 max-h-[60vh] overflow-y-auto pr-1">
          <OtherFilterContent formData={formData} updateFormData={updateFormData} />
        </div>
      )}
    </div>
  );
}
