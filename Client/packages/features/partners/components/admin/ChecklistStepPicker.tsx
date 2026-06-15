import { useEffect, useMemo, useState } from "react";

import { useLocalization } from "packages/contexts";
import type { ChecklistTab } from "packages/features/checklists/types/checklists";
import { CHECKLIST_TITLES } from "packages/features/checklists/types/checklists";
import type { ChecklistStepOption } from "packages/features/partners/api/partners";
import {
  resolveChecklistRoles,
  sectionsForChecklistRole,
  stepLabel,
  stepsForSection,
} from "packages/features/partners/utils/checklistStepPicker";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Label from "packages/ui/components/structure/text/Label";
import type { Workspace } from "packages/utils/product/workspace";

import { Button, Dropdown } from "@/components/ui";
import { ProfileTagChip } from "@/features/profile/components/ProfileTagChip";

type ChecklistStepPickerProps = {
  steps: ChecklistStepOption[];
  targetRoles: string[];
  value: string[];
  onChange: (stepIds: string[]) => void;
  disabled?: boolean;
};

export function ChecklistStepPicker({
  steps,
  targetRoles,
  value,
  onChange,
  disabled,
}: ChecklistStepPickerProps) {
  const { t } = useLocalization();
  const checklistRoles = useMemo(() => resolveChecklistRoles(targetRoles), [targetRoles]);
  const [checklistRole, setChecklistRole] = useState<Workspace>(() => checklistRoles[0] ?? "buyer");
  const [section, setSection] = useState<ChecklistTab | "">("");
  const [pendingStepId, setPendingStepId] = useState("");

  useEffect(() => {
    if (!checklistRoles.includes(checklistRole)) {
      setChecklistRole(checklistRoles[0] ?? "buyer");
      setSection("");
      setPendingStepId("");
    }
  }, [checklistRole, checklistRoles]);

  const sections = useMemo(() => sectionsForChecklistRole(checklistRole), [checklistRole]);

  const sectionSteps = useMemo(
    () => (section ? stepsForSection(steps, section) : []),
    [steps, section]
  );

  const sectionOptions = useMemo(
    () =>
      sections.map((id) => ({
        value: id,
        label: CHECKLIST_TITLES[id],
      })),
    [sections]
  );

  const stepOptions = useMemo(
    () =>
      sectionSteps.map((s) => ({
        value: s.step_id,
        label: s.label,
      })),
    [sectionSteps]
  );

  const showRolePicker = checklistRoles.length > 1;
  const hasSections = sectionOptions.length > 0;

  return (
    <Box className="flex flex-col gap-3">
      {showRolePicker ? (
        <>
          <Label>{t("partners.admin.form.checklist_role")}</Label>
          <Dropdown
            size="sm"
            label={t("partners.admin.form.checklist_role")}
            hideLabel
            options={checklistRoles.map((role) => ({
              value: role,
              label: t(`workspace.switcher.${role}`),
            }))}
            value={checklistRole}
            onChange={(role) => {
              setChecklistRole(role);
              setSection("");
              setPendingStepId("");
            }}
            disabled={disabled}
          />
        </>
      ) : null}

      {!hasSections ? (
        <BodyText size="xs" muted>
          {t("partners.admin.form.steps_empty")}
        </BodyText>
      ) : (
        <>
          <Label>{t("partners.admin.form.section")}</Label>
          <Dropdown
            size="sm"
            label={t("partners.admin.form.section")}
            hideLabel
            placeholder={t("partners.admin.form.section_placeholder")}
            options={sectionOptions}
            value={section || undefined}
            onChange={(nextSection) => {
              setSection(nextSection);
              setPendingStepId("");
            }}
            disabled={disabled}
            clearable
            onClear={() => {
              setSection("");
              setPendingStepId("");
            }}
          />

          {section ? (
            <>
              <Label>{t("partners.admin.form.step")}</Label>
              <Dropdown
                size="sm"
                label={t("partners.admin.form.step")}
                hideLabel
                placeholder={t("partners.admin.form.step_placeholder")}
                searchable
                options={stepOptions}
                value={pendingStepId || undefined}
                onChange={setPendingStepId}
                disabled={disabled || stepOptions.length === 0}
                clearable
                onClear={() => setPendingStepId("")}
              />
              <Button
                variant="secondary"
                size="sm"
                type="button"
                disabled={disabled || !pendingStepId || value.includes(pendingStepId)}
                onClick={() => {
                  if (!pendingStepId || value.includes(pendingStepId)) return;
                  onChange([...value, pendingStepId]);
                  setPendingStepId("");
                }}
              >
                {t("partners.admin.form.add_step")}
              </Button>
            </>
          ) : null}
        </>
      )}

      {value.length > 0 ? (
        <Box className="flex flex-col gap-2">
          <BodyText size="xs" muted>
            {t("partners.admin.form.selected_steps")}
          </BodyText>
          <Box className="flex flex-wrap gap-2">
            {value.map((stepId) => (
              <ProfileTagChip
                key={stepId}
                label={stepLabel(steps, stepId)}
                onRemove={
                  disabled ? undefined : () => onChange(value.filter((id) => id !== stepId))
                }
                disabled={disabled}
                removeLabel={t("partners.admin.form.remove_step", {
                  defaultValue: "Remove step",
                })}
              />
            ))}
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
