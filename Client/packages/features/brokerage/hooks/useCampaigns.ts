import { useCallback, useMemo, useState } from "react";

import type { CampaignAgentType } from "packages/features/brokerage/utils/campaigns/campaignAudienceReach";
import { estimateCampaignReach } from "packages/features/brokerage/utils/campaigns/campaignAudienceReach";
import {
  bodyFieldsFromPreview,
  buildControlSampleEmail,
  buildCustomCampaignCategory,
  type BuiltInCampaignCategoryId,
  CAMPAIGN_CATEGORIES_FIXTURE,
  type CampaignCadence,
  type CampaignCategoryId,
  type CampaignStatus,
  type CategoryCampaign,
  cloneCategoryCampaign,
  CONTROL_VARIANT_KEY,
  type DashboardServiceKey,
  getCampaignTemplateSeed,
  isControlEmail,
  partitionControlEmails,
  type SampleEmail,
  variantWeeklyPerformance,
} from "packages/features/brokerage/utils/campaigns/campaignFixtures";

export type CampaignVariantDraft = {
  subject: string;
  preview_body: string;
  scheduleMode: "now" | "later";
  scheduledDate?: string;
  scheduledTime?: string;
  agentTypes: CampaignAgentType[];
  bookingLink?: string;
  /** Optional CTA label when editing an existing variant. */
  ctaLabel?: string;
};

export type CampaignVariantContentDraft = {
  subject: string;
  preview_body: string;
  bookingLink?: string;
  ctaLabel?: string;
};

export type CampaignSettingsDraft = {
  label: string;
  description?: string;
  status: CampaignStatus;
  cadence: CampaignCadence;
  startedAt?: string;
  defaultScheduleMode: "now" | "later";
  defaultScheduledDate?: string;
  defaultScheduledTime?: string;
  defaultAgentTypes: CampaignAgentType[];
  baseline_attach_rate_percent: number | null;
  post_attach_rate_percent: number | null;
  fee_assumption: number | null;
  dashboard_service?: DashboardServiceKey;
};

function nextVariantKey(emails: SampleEmail[]): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const used = new Set(emails.filter((e) => !isControlEmail(e)).map((e) => e.variant_key));
  for (const letter of alphabet) {
    if (!used.has(letter)) return letter;
  }
  return `V${emails.filter((e) => !isControlEmail(e)).length + 1}`;
}

function cloneCategories(): CategoryCampaign[] {
  return CAMPAIGN_CATEGORIES_FIXTURE.map(cloneCategoryCampaign);
}

export function useCampaignCategories() {
  const [categories, setCategories] = useState<CategoryCampaign[]>(cloneCategories);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const addVariant = useCallback((categoryId: CampaignCategoryId, draft: CampaignVariantDraft) => {
    setCategories((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category;
        const { treatments, control } = partitionControlEmails(category.emails);
        const variant_key = nextVariantKey(category.emails);
        const sent = estimateCampaignReach(draft.agentTypes);
        const subject = draft.subject.trim();
        const preview_body = draft.preview_body.trim();
        const { intro, body_paragraphs } = bodyFieldsFromPreview(preview_body);
        const baselineAttach = category.baseline_attach_rate_percent ?? 0;
        const postAttach = category.post_attach_rate_percent ?? baselineAttach;
        const newEmail: SampleEmail = {
          id: `${categoryId}-email-${variant_key.toLowerCase()}-${Date.now()}`,
          variant_key,
          subject,
          preview_body,
          headline: subject,
          intro: intro || preview_body,
          body_paragraphs,
          cta_label: draft.ctaLabel?.trim() || "Book intro",
          funnel: { sent, opened: 0, clicked: 0, attached: 0 },
          is_winner: false,
          booking_link: draft.bookingLink?.trim() || undefined,
          performance_weekly: variantWeeklyPerformance(
            baselineAttach,
            postAttach,
            30,
            40,
            3,
            6.5,
            treatments.length
          ),
        };
        return {
          ...category,
          emails: control ? [...treatments, newEmail, control] : [...treatments, newEmail],
        };
      })
    );
    setStatusMessage(draft.scheduleMode === "later" ? "Scheduled" : "Queued");
  }, []);

  const updateVariant = useCallback(
    (categoryId: CampaignCategoryId, emailId: string, draft: CampaignVariantContentDraft) => {
      setCategories((prev) =>
        prev.map((category) => {
          if (category.id !== categoryId) return category;
          const subject = draft.subject.trim();
          const preview_body = draft.preview_body.trim();
          const { intro, body_paragraphs } = bodyFieldsFromPreview(preview_body);
          return {
            ...category,
            emails: category.emails.map((email) => {
              if (email.id !== emailId) return email;
              if (isControlEmail(email)) return email;
              return {
                ...email,
                subject,
                preview_body,
                headline: subject,
                intro: intro || preview_body,
                body_paragraphs,
                cta_label: draft.ctaLabel?.trim() || email.cta_label,
                booking_link: draft.bookingLink?.trim() || undefined,
              };
            }),
          };
        })
      );
      setStatusMessage("Variant updated");
    },
    []
  );

  const removeControl = useCallback((categoryId: CampaignCategoryId) => {
    setCategories((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category;
        const { treatments } = partitionControlEmails(category.emails);
        return { ...category, emails: treatments };
      })
    );
    setStatusMessage("Control group removed");
  }, []);

  const includeControl = useCallback((categoryId: CampaignCategoryId) => {
    setCategories((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category;
        if (category.emails.some(isControlEmail)) return category;
        const control = buildControlSampleEmail(
          category.id,
          category.baseline_attach_rate_percent ?? 0
        );
        return { ...category, emails: [...category.emails, control] };
      })
    );
    setStatusMessage("Control group included");
  }, []);

  const addTemplateCampaign = useCallback(
    (templateId: BuiltInCampaignCategoryId): { added: boolean; categoryId: CampaignCategoryId } => {
      let result: { added: boolean; categoryId: CampaignCategoryId } = {
        added: false,
        categoryId: templateId,
      };
      setCategories((prev) => {
        if (prev.some((c) => c.id === templateId)) {
          return prev;
        }
        result = { added: true, categoryId: templateId };
        return [...prev, getCampaignTemplateSeed(templateId)];
      });
      if (result.added) {
        setStatusMessage("Campaign added");
      }
      return result;
    },
    []
  );

  const addCustomCampaign = useCallback(
    (name: string, description?: string): CampaignCategoryId => {
      const category = buildCustomCampaignCategory(name, description);
      setCategories((prev) => [...prev, category]);
      setStatusMessage("Campaign added");
      return category.id;
    },
    []
  );

  const updateCampaignSettings = useCallback(
    (categoryId: CampaignCategoryId, draft: CampaignSettingsDraft) => {
      setCategories((prev) =>
        prev.map((category) => {
          if (category.id !== categoryId) return category;
          const trimmedDescription = draft.description?.trim();
          return {
            ...category,
            label: draft.label.trim(),
            description: trimmedDescription || undefined,
            status: draft.status,
            cadence: draft.cadence,
            startedAt: draft.startedAt?.trim() || undefined,
            defaultScheduleMode: draft.defaultScheduleMode,
            defaultScheduledDate:
              draft.defaultScheduleMode === "later"
                ? draft.defaultScheduledDate?.trim() || undefined
                : undefined,
            defaultScheduledTime:
              draft.defaultScheduleMode === "later"
                ? draft.defaultScheduledTime?.trim() || undefined
                : undefined,
            defaultAgentTypes: [...draft.defaultAgentTypes],
            baseline_attach_rate_percent: draft.baseline_attach_rate_percent,
            post_attach_rate_percent: draft.post_attach_rate_percent,
            fee_assumption: draft.fee_assumption,
            dashboard_service: draft.dashboard_service,
          };
        })
      );
      setStatusMessage("Settings updated");
    },
    []
  );

  const clearStatusMessage = useCallback(() => setStatusMessage(null), []);

  const sectionIds = useMemo(() => categories.map((c) => c.id), [categories]);

  return {
    categories,
    sectionIds,
    isLoading: false,
    error: null as string | null,
    addVariant,
    updateVariant,
    updateCampaignSettings,
    removeControl,
    includeControl,
    addTemplateCampaign,
    addCustomCampaign,
    statusMessage,
    clearStatusMessage,
  };
}

export type { BuiltInCampaignCategoryId, CampaignCategoryId, CategoryCampaign, SampleEmail };
export { CONTROL_VARIANT_KEY };
