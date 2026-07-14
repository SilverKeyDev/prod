import { useEffect, useMemo, useState } from "react";

import { CampaignAudienceFields } from "packages/features/brokerage/components/campaigns/CampaignAudienceFields";
import { CampaignScheduleFields } from "packages/features/brokerage/components/campaigns/CampaignScheduleFields";
import type {
  CampaignVariantContentDraft,
  CampaignVariantDraft,
} from "packages/features/brokerage/hooks/useCampaigns";
import {
  type CampaignAgentType,
  estimateCampaignReach,
} from "packages/features/brokerage/utils/campaigns/campaignAudienceReach";
import type {
  CategoryCampaign,
  SampleEmail,
} from "packages/features/brokerage/utils/campaigns/campaignFixtures";
import { Button, CancelButton, Textarea } from "packages/ui";
import { Input } from "packages/ui/components/inputs/form/inputs/Input.web";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Label from "packages/ui/components/structure/text/Label";
import BaseModal from "packages/ui/components/surfaces/modals/BaseModal";

type CampaignVariantModalProps = {
  isOpen: boolean;
  category: CategoryCampaign | null;
  mode?: "create" | "edit";
  /** Required when mode is edit. */
  email?: SampleEmail | null;
  onClose: () => void;
  onSubmit: (draft: CampaignVariantDraft) => void;
  onUpdate?: (draft: CampaignVariantContentDraft) => void;
};

type FormSetters = {
  setSubject: (v: string) => void;
  setBody: (v: string) => void;
  setCtaLabel: (v: string) => void;
  setScheduleMode: (v: "now" | "later") => void;
  setScheduledDate: (v: string) => void;
  setScheduledTime: (v: string) => void;
  setAgentTypes: (v: CampaignAgentType[]) => void;
  setBookingLink: (v: string) => void;
  setError: (v: string | null) => void;
};

function bodyFromEmail(email: SampleEmail): string {
  if (email.body_paragraphs.length > 0) {
    return [email.intro, ...email.body_paragraphs].join("\n\n");
  }
  return email.intro || email.preview_body;
}

function resetFormState(setters: FormSetters) {
  setters.setSubject("");
  setters.setBody("");
  setters.setCtaLabel("Book intro");
  setters.setScheduleMode("now");
  setters.setScheduledDate("");
  setters.setScheduledTime("");
  setters.setAgentTypes(["all"]);
  setters.setBookingLink("");
  setters.setError(null);
}

function prefillsFromCategory(category: CategoryCampaign, setters: FormSetters) {
  setters.setSubject("");
  setters.setBody("");
  setters.setCtaLabel("Book intro");
  setters.setScheduleMode(category.defaultScheduleMode);
  setters.setScheduledDate(category.defaultScheduledDate ?? "");
  setters.setScheduledTime(category.defaultScheduledTime ?? "");
  setters.setAgentTypes(
    category.defaultAgentTypes.length > 0 ? [...category.defaultAgentTypes] : ["all"]
  );
  setters.setBookingLink("");
  setters.setError(null);
}

function prefillsFromEmail(email: SampleEmail, setters: FormSetters) {
  setters.setSubject(email.subject);
  setters.setBody(bodyFromEmail(email));
  setters.setCtaLabel(email.cta_label);
  setters.setBookingLink(email.booking_link ?? "");
  setters.setScheduleMode("now");
  setters.setScheduledDate("");
  setters.setScheduledTime("");
  setters.setAgentTypes(["all"]);
  setters.setError(null);
}

export function CampaignVariantModal({
  isOpen,
  category,
  mode = "create",
  email = null,
  onClose,
  onSubmit,
  onUpdate,
}: CampaignVariantModalProps) {
  const isEdit = mode === "edit";
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Book intro");
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
      setCtaLabel,
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
    if (!isOpen || !category) return;
    if (isEdit && email) {
      prefillsFromEmail(email, formSetters);
      return;
    }
    prefillsFromCategory(category, formSetters);
  }, [isOpen, category, isEdit, email, formSetters]);

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

    if (isEdit) {
      onUpdate?.({
        subject: subject.trim(),
        preview_body: body.trim(),
        bookingLink: bookingLink.trim() || undefined,
        ctaLabel: ctaLabel.trim() || undefined,
      });
      resetAndClose();
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
      ctaLabel: ctaLabel.trim() || undefined,
    });
    resetAndClose();
  };

  const title = isEdit
    ? email
      ? `Edit variant ${email.variant_key}`
      : "Edit variant"
    : category
      ? `New variant: ${category.label}`
      : "New variant";

  const canShow = isOpen && category !== null && (!isEdit || email !== null);

  return (
    <BaseModal
      isOpen={canShow}
      onClose={resetAndClose}
      title={title}
      size="md"
      showCloseButton
      footerContent={
        <Box className="flex justify-end gap-2">
          <CancelButton onClick={resetAndClose}>Cancel</CancelButton>
          <Button type="button" variant="secondary" onClick={handleSubmit}>
            {isEdit ? "Save" : scheduleMode === "later" ? "Schedule" : "Queue"}
          </Button>
        </Box>
      }
    >
      <Box
        className="flex flex-col gap-4"
        data-testid={isEdit ? "edit-campaign-variant-form" : "create-campaign-variant-form"}
      >
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
            rows={isEdit ? 5 : 3}
            placeholder="One short sentence"
            required
          />
        </Box>
        <Input
          label="CTA label"
          value={ctaLabel}
          onValueChange={setCtaLabel}
          placeholder="Book intro"
          helperText="Button text in the email"
        />
        <Input
          label="Booking link"
          type="url"
          value={bookingLink}
          onValueChange={setBookingLink}
          placeholder="https://calendly.com/your-link"
          helperText="Optional"
        />
        {!isEdit ? (
          <>
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
          </>
        ) : null}
        {error ? (
          <BodyText size="xs" className="text-state-danger" role="alert">
            {error}
          </BodyText>
        ) : null}
      </Box>
    </BaseModal>
  );
}

/** @deprecated Prefer CampaignVariantModal */
export const CreateCampaignVariantModal = CampaignVariantModal;
