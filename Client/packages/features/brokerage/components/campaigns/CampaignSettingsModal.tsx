import { useEffect, useMemo, useState } from "react";

import { CampaignAudienceFields } from "packages/features/brokerage/components/campaigns/CampaignAudienceFields";
import { CampaignScheduleFields } from "packages/features/brokerage/components/campaigns/CampaignScheduleFields";
import type { CampaignSettingsDraft } from "packages/features/brokerage/hooks/useCampaigns";
import {
  type CampaignAgentType,
  estimateCampaignReach,
} from "packages/features/brokerage/utils/campaigns/campaignAudienceReach";
import type {
  CampaignCadence,
  CampaignStatus,
  CategoryCampaign,
  DashboardServiceKey,
} from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import { CAMPAIGN_STATUS_LABELS } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import { Button, CancelButton, Select, Textarea } from "packages/ui";
import { Input } from "packages/ui/components/inputs/form/inputs/Input.web";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Label from "packages/ui/components/structure/text/Label";
import Title from "packages/ui/components/structure/text/Title";
import BaseModal from "packages/ui/components/surfaces/modals/BaseModal";

type CampaignSettingsModalProps = {
  isOpen: boolean;
  category: CategoryCampaign | null;
  onClose: () => void;
  onSave: (draft: CampaignSettingsDraft) => void;
};

const STATUS_OPTIONS = (Object.keys(CAMPAIGN_STATUS_LABELS) as CampaignStatus[]).map((value) => ({
  value,
  label: CAMPAIGN_STATUS_LABELS[value],
}));

const CADENCE_OPTIONS: { value: CampaignCadence; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
];

const SERVICE_OPTIONS: { value: DashboardServiceKey | ""; label: string }[] = [
  { value: "", label: "None" },
  { value: "title", label: "Title" },
  { value: "lending", label: "Lending" },
  { value: "home_warranty", label: "Home warranty" },
];

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function numberInputValue(value: number | null): string {
  return value == null ? "" : String(value);
}

export function CampaignSettingsModal({
  isOpen,
  category,
  onClose,
  onSave,
}: CampaignSettingsModalProps) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CampaignStatus>("draft");
  const [cadence, setCadence] = useState<CampaignCadence>("weekly");
  const [startedAt, setStartedAt] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [agentTypes, setAgentTypes] = useState<CampaignAgentType[]>(["all"]);
  const [baselineAttach, setBaselineAttach] = useState("");
  const [postAttach, setPostAttach] = useState("");
  const [feeAssumption, setFeeAssumption] = useState("");
  const [dashboardService, setDashboardService] = useState<DashboardServiceKey | "">("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !category) return;
    setLabel(category.label);
    setDescription(category.description ?? "");
    setStatus(category.status);
    setCadence(category.cadence);
    setStartedAt(category.startedAt ?? "");
    setScheduleMode(category.defaultScheduleMode);
    setScheduledDate(category.defaultScheduledDate ?? "");
    setScheduledTime(category.defaultScheduledTime ?? "");
    setAgentTypes([...category.defaultAgentTypes]);
    setBaselineAttach(numberInputValue(category.baseline_attach_rate_percent));
    setPostAttach(numberInputValue(category.post_attach_rate_percent));
    setFeeAssumption(numberInputValue(category.fee_assumption));
    setDashboardService(category.dashboard_service ?? "");
    setError(null);
  }, [isOpen, category]);

  const estimatedReach = useMemo(() => estimateCampaignReach(agentTypes), [agentTypes]);

  const resetAndClose = () => {
    setError(null);
    onClose();
  };

  const handleSave = () => {
    if (!label.trim()) {
      setError("Name is required.");
      return;
    }
    if (agentTypes.length === 0) {
      setError("Select at least one agent type.");
      return;
    }
    if (scheduleMode === "later" && (!scheduledDate || !scheduledTime)) {
      setError("Pick a date and time for the default schedule.");
      return;
    }

    const baseline = parseOptionalNumber(baselineAttach);
    const post = parseOptionalNumber(postAttach);
    const fee = parseOptionalNumber(feeAssumption);

    if (baselineAttach.trim() && baseline == null) {
      setError("Baseline attach must be a number.");
      return;
    }
    if (postAttach.trim() && post == null) {
      setError("Post attach must be a number.");
      return;
    }
    if (feeAssumption.trim() && fee == null) {
      setError("Fee must be a number.");
      return;
    }
    if (baseline != null && baseline < 0) {
      setError("Baseline attach cannot be negative.");
      return;
    }
    if (post != null && post < 0) {
      setError("Post attach cannot be negative.");
      return;
    }
    if (fee != null && fee < 0) {
      setError("Fee cannot be negative.");
      return;
    }
    if (baseline != null && post != null && post < baseline) {
      setError("Post attach must be at least baseline attach.");
      return;
    }

    onSave({
      label: label.trim(),
      description: description.trim() || undefined,
      status,
      cadence,
      startedAt: startedAt.trim() || undefined,
      defaultScheduleMode: scheduleMode,
      defaultScheduledDate: scheduleMode === "later" ? scheduledDate : undefined,
      defaultScheduledTime: scheduleMode === "later" ? scheduledTime : undefined,
      defaultAgentTypes: agentTypes,
      baseline_attach_rate_percent: baseline,
      post_attach_rate_percent: post,
      fee_assumption: fee,
      dashboard_service: dashboardService || undefined,
    });
    resetAndClose();
  };

  const canShow = isOpen && category !== null;
  const title = category ? `Settings: ${category.label}` : "Campaign settings";

  return (
    <BaseModal
      isOpen={canShow}
      onClose={resetAndClose}
      title={title}
      size="lg"
      showCloseButton
      footerContent={
        <Box className="flex justify-end gap-2">
          <CancelButton onClick={resetAndClose} data-testid="campaign-settings-cancel">
            Cancel
          </CancelButton>
          <Button
            type="button"
            variant="secondary"
            onClick={handleSave}
            data-testid="campaign-settings-save"
          >
            Save settings
          </Button>
        </Box>
      }
    >
      <Box className="flex flex-col gap-6" data-testid="campaign-settings-modal">
        <Box className="flex flex-col gap-3">
          <Title size="sm" as="h3">
            General
          </Title>
          <Input
            label="Name"
            value={label}
            onValueChange={setLabel}
            required
            placeholder="Campaign name"
          />
          <Box>
            <Label htmlFor="campaign-settings-description" className="mb-2">
              Description
            </Label>
            <Textarea
              id="campaign-settings-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional notes for this campaign"
            />
          </Box>
          <Select
            id="campaign-settings-status"
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(value) => setStatus(value as CampaignStatus)}
            size="sm"
          />
        </Box>

        <Box className="flex flex-col gap-3">
          <Title size="sm" as="h3">
            Schedule
          </Title>
          <Select
            id="campaign-settings-cadence"
            label="Cadence"
            options={CADENCE_OPTIONS}
            value={cadence}
            onChange={(value) => setCadence(value as CampaignCadence)}
            size="sm"
          />
          <Input
            label="Started on"
            type="date"
            value={startedAt}
            onValueChange={setStartedAt}
            helperText="Shown on the campaign header"
          />
          <CampaignScheduleFields
            scheduleMode={scheduleMode}
            onScheduleModeChange={setScheduleMode}
            scheduledDate={scheduledDate}
            onScheduledDateChange={setScheduledDate}
            scheduledTime={scheduledTime}
            onScheduledTimeChange={setScheduledTime}
          />
        </Box>

        <Box className="flex flex-col gap-3">
          <Title size="sm" as="h3">
            Audience
          </Title>
          <CampaignAudienceFields
            agentTypes={agentTypes}
            onAgentTypesChange={setAgentTypes}
            estimatedReach={estimatedReach}
          />
        </Box>

        <Box className="flex flex-col gap-3">
          <Title size="sm" as="h3">
            Goals
          </Title>
          <Box className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Baseline attach %"
              type="number"
              value={baselineAttach}
              onValueChange={setBaselineAttach}
              placeholder="e.g. 12"
            />
            <Input
              label="Post attach %"
              type="number"
              value={postAttach}
              onValueChange={setPostAttach}
              placeholder="e.g. 16"
            />
            <Input
              label="Fee $/attach"
              type="number"
              value={feeAssumption}
              onValueChange={setFeeAssumption}
              placeholder="e.g. 250"
            />
          </Box>
          <Select
            id="campaign-settings-service"
            label="Dashboard service"
            options={SERVICE_OPTIONS}
            value={dashboardService}
            onChange={(value) => setDashboardService(value as DashboardServiceKey | "")}
            size="sm"
          />
        </Box>

        {error ? (
          <BodyText size="xs" className="text-state-danger" role="alert">
            {error}
          </BodyText>
        ) : null}
      </Box>
    </BaseModal>
  );
}
