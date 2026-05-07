import React from "react";

import {
  LotSizeAndHomeAgeSliders,
  type LotSizeHomeAgeSearchOverridesPatch,
} from "packages/features/profile";
import {
  ARCHITECTURAL_STYLE_OPTIONS,
  PROPERTY_USE_OPTIONS,
  RENOVATION_OPTIONS,
  WALKABILITY_OPTIONS,
} from "packages/features/search/types/otherFilterOptions";
import { Box } from "packages/ui/components/primitives";

import { Dropdown } from "@/components/ui";
import Label from "@/features/profile/components/settings/inputs/Label";
import OptionTagInput from "@/features/profile/components/settings/inputs/tags/OptionTagInput.web";
import OnPerTagInput from "@/features/profile/components/settings/inputs/tags/TagInput.web";
import {
  FIELD_LABELS,
  HOUSING_TYPE_OPTIONS,
  type OnboardingData,
  parseHousingTypes,
  serializeHousingTypes,
} from "@/features/profile/utils";

export type OtherFilterContentProps = {
  formData: Partial<OnboardingData>;
  updateFormData: (field: string | number | symbol, value: unknown) => void;
  /** When true, omit the housing type field (e.g. when shown in a separate "Home Type" filter) */
  hideHousingType?: boolean;
  onSearchFilterOverridesPatch?: (patch: LotSizeHomeAgeSearchOverridesPatch) => void;
  /** Borderless dropdown triggers (e.g. search header popover). */
  noBorder?: boolean;
  /** Render dropdown menus in a portal so they are not clipped inside scrollable panels. Defaults to Dropdown's own default (true). */
  menuInPortal?: boolean;
  /** When using menuInPortal inside a Popover, forward registration so outside-click does not close the popover. Auto-wired by `Dropdown` via `PopoverContext` when omitted. */
  registerOutsideClickSafeTarget?: (element: HTMLElement) => () => void;
};

export default function OtherFilterContent({
  formData,
  updateFormData,
  hideHousingType = false,
  onSearchFilterOverridesPatch,
  noBorder = false,
  menuInPortal,
  registerOutsideClickSafeTarget,
}: OtherFilterContentProps): React.ReactElement {
  return (
    <Box className="space-y-4">
      <Box className="grid gap-3 sm:grid-cols-2">
        {!hideHousingType && (
          <Box>
            <Label>{FIELD_LABELS.PREFERRED_HOUSING_TYPE}</Label>
            <OptionTagInput
              options={HOUSING_TYPE_OPTIONS}
              value={parseHousingTypes(formData.preferred_housing_type)}
              onChange={(arr) =>
                updateFormData("preferred_housing_type", serializeHousingTypes(arr))
              }
              isEditMode={true}
            />
          </Box>
        )}
        <LotSizeAndHomeAgeSliders
          formData={formData}
          updateFormData={updateFormData}
          onSearchFilterOverridesPatch={onSearchFilterOverridesPatch}
        />
        <Box>
          <Label>{FIELD_LABELS.PREFERRED_ARCHITECTURAL_STYLE}</Label>
          <Dropdown
            value={formData.preferred_architectural_style ?? ""}
            onChange={(v) => updateFormData("preferred_architectural_style", v)}
            options={ARCHITECTURAL_STYLE_OPTIONS}
            placeholder="Select architectural style"
            size="sm"
            noBorder={noBorder}
            menuInPortal={menuInPortal}
            registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
          />
        </Box>
        <Box>
          <Label>{FIELD_LABELS.RENOVATION_PREFERENCE}</Label>
          <Dropdown
            value={formData.renovation_preference ?? ""}
            onChange={(v) => updateFormData("renovation_preference", v)}
            options={RENOVATION_OPTIONS}
            placeholder="Select renovation preference"
            size="sm"
            noBorder={noBorder}
            menuInPortal={menuInPortal}
            registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
          />
        </Box>
        <Box>
          <Label>{FIELD_LABELS.INTENDED_PROPERTY_USE}</Label>
          <Dropdown
            value={formData.intended_property_use ?? ""}
            onChange={(v) => updateFormData("intended_property_use", v)}
            options={PROPERTY_USE_OPTIONS}
            placeholder="Select intended use"
            size="sm"
            noBorder={noBorder}
            menuInPortal={menuInPortal}
            registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
          />
        </Box>
        <Box className="sm:col-span-2">
          <Label>{FIELD_LABELS.WALKABILITY_IMPORTANCE}</Label>
          <Dropdown
            value={formData.walkability_importance ?? ""}
            onChange={(v) => updateFormData("walkability_importance", v)}
            options={WALKABILITY_OPTIONS}
            placeholder="Select walkability importance"
            size="sm"
            noBorder={noBorder}
            menuInPortal={menuInPortal}
            registerOutsideClickSafeTarget={registerOutsideClickSafeTarget}
          />
        </Box>
      </Box>

      <Box>
        <Label>{FIELD_LABELS.OTHER_REQUIREMENTS}</Label>
        <OnPerTagInput
          value={(formData.other_requirements as string[]) ?? []}
          onChange={(v: string[]) => updateFormData("other_requirements", v)}
          placeholder="e.g., street parking, no gated communities"
          isEditMode={true}
        />
      </Box>
    </Box>
  );
}
