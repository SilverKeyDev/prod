import { useEffect, useMemo, useState } from "react";

import { CampaignAudienceFields } from "packages/features/brokerage/components/campaigns/CampaignAudienceFields";
import { CampaignScheduleFields } from "packages/features/brokerage/components/campaigns/CampaignScheduleFields";
import type { CampaignVariantDraft } from "packages/features/brokerage/hooks/useCampaigns";
import {
  type CampaignAgentType,
  estimateCampaignReach,
} from "packages/features/brokerage/utils/campaigns/campaignAudienceReach";
import type { CategoryCampaign } from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import { Button, CancelButton, Textarea } from "packages/ui";
import { Input } from "packages/ui/components/inputs/form/inputs/Input.web";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Label from "packages/ui/components/structure/text/Label";
import BaseModal from "packages/ui/components/surfaces/modals/BaseModal";

type CreateCampaignVariantModalProps = {
  isOpen: boolean;
  category: CategoryCampaign | null;
  onClose: () => void;
  onSubmit: (draft: CampaignVariantDraft) => void;
};

type FormSetters = {
  setSubject: (v: string) => void;
  setBody: (v: string) => void;
  setScheduleMode: (v: "now" | "later") => void;
  setScheduledDate: (v: string) => void;
  setScheduledTime: (v: string) => void;
  setAgentTypes: (v: CampaignAgentType[]) => void;
  setBookingLink: (v: string) => void;
  setError: (v: string | null) => void;
};

function resetFormState(setters: FormSetters) {
  setters.setSubject("");
  setters.setBody("");
  setters.setScheduleMode("now");
  setters.setScheduledDate("");
  setters.setScheduledTime("");
  setters.setAgentTypes(["all"]);
  setters.setBookingLink("");
  setters.setError(null);
}

export function CreateCampaignVariantModal({
  isOpen,
  category,
  onClose,
  onSubmit,
}: CreateCampaignVariantModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [agentTypes, setAgentTypes] = useState<CampaignAgentType[]>(["all"]);
  const [bookingLink, setBookingLink] = useState("");
  const [error, setError] = useState<string | null>(null);

  const formSetters = useMemo(
    (): FormSetters => ({
      setSubject,
      setBody,
      setScheduleMode,
      setScheduledDate,
      setScheduledTime,
      setAgentTypes,
      setBookingLink,
      setError,
    }),
    []
  );

  useEffect(() => {
    if (isOpen && category) {
      resetFormState(formSetters);
    }
  }, [isOpen, category, formSetters]);

  const estimatedReach = useMemo(() => estimateCampaignReach(agentTypes), [agentTypes]);

  const resetAndClose = () => {
    resetFormState(formSetters);
    onClose();
  };

  const handleSubmit = () => {
    if (!subject.trim() || !body.trim()) {
      setError("Subject and body required.");
      return;
    }
    if (agentTypes.length === 0) {
      setError("Select at least one agent type.");
      return;
    }
    if (scheduleMode === "later" && (!scheduledDate || !scheduledTime)) {
      setError("Pick a date and time.");
      return;
    }
    onSubmit({
      subject: subject.trim(),
      preview_body: body.trim(),
      scheduleMode,
      scheduledDate: scheduleMode === "later" ? scheduledDate : undefined,
      scheduledTime: scheduleMode === "later" ? scheduledTime : undefined,
      agentTypes,
      bookingLink: bookingLink.trim() || undefined,
    });
    resetAndClose();
  };

  return (
    <BaseModal
      isOpen={isOpen && category !== null}
      onClose={resetAndClose}
      title={category ? `New variant: ${category.label}` : "New variant"}
      size="md"
      showCloseButton
      footerContent={
        <Box className="flex justify-end gap-2">
          <CancelButton onClick={resetAndClose}>Cancel</CancelButton>
          <Button type="button" variant="secondary" onClick={handleSubmit}>
            {scheduleMode === "later" ? "Schedule" : "Queue"}
          </Button>
        </Box>
      }
    >
      <Box className="flex flex-col gap-4" data-testid="create-campaign-variant-form">
        <Input
          label="Subject"
          value={subject}
          onValueChange={setSubject}
          required
          placeholder="Short subject"
        />
        <Box>
          <Label htmlFor="campaign-variant-body" className="mb-2">
            Body
          </Label>
          <Textarea
            id="campaign-variant-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="One short sentence"
            required
          />
        </Box>
        <Input
          label="Booking link"
          type="url"
          value={bookingLink}
          onValueChange={setBookingLink}
          placeholder="https://calendly.com/your-link"
          helperText="Optional"
        />
        <CampaignScheduleFields
          scheduleMode={scheduleMode}
          onScheduleModeChange={setScheduleMode}
          scheduledDate={scheduledDate}
          onScheduledDateChange={setScheduledDate}
          scheduledTime={scheduledTime}
          onScheduledTimeChange={setScheduledTime}
        />
        <CampaignAudienceFields
          agentTypes={agentTypes}
          onAgentTypesChange={setAgentTypes}
          estimatedReach={estimatedReach}
        />
        {error ? (
          <BodyText size="xs" className="text-state-danger" role="alert">
            {error}
          </BodyText>
        ) : null}
      </Box>
    </BaseModal>
  );
}
