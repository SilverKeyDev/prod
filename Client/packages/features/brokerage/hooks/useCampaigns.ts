import { useCallback, useMemo, useState } from "react";

import type { CampaignAgentType } from "packages/features/brokerage/utils/campaigns/campaignAudienceReach";
import { estimateCampaignReach } from "packages/features/brokerage/utils/campaigns/campaignAudienceReach";
import {
  CAMPAIGN_CATEGORIES_FIXTURE,
  type CampaignCategoryId,
  type CategoryCampaign,
  type SampleEmail,
} from "packages/features/brokerage/utils/campaigns/campaignFixtures";

export type CampaignVariantDraft = {
  subject: string;
  preview_body: string;
  scheduleMode: "now" | "later";
  scheduledDate?: string;
  scheduledTime?: string;
  agentTypes: CampaignAgentType[];
  bookingLink?: string;
};

function nextVariantKey(emails: SampleEmail[]): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const used = new Set(emails.map((e) => e.variant_key));
  for (const letter of alphabet) {
    if (!used.has(letter)) return letter;
  }
  return `V${emails.length + 1}`;
}

function cloneCategories(): CategoryCampaign[] {
  return CAMPAIGN_CATEGORIES_FIXTURE.map((category) => ({
    ...category,
    emails: category.emails.map((email) => ({ ...email, funnel: { ...email.funnel } })),
    performance_weekly: category.performance_weekly.map((p) => ({ ...p })),
    insights: {
      what_worked: [...category.insights.what_worked],
      why_guesses: [...category.insights.why_guesses],
    },
  }));
}

export function useCampaignCategories() {
  const [categories, setCategories] = useState<CategoryCampaign[]>(cloneCategories);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const addVariant = useCallback((categoryId: CampaignCategoryId, draft: CampaignVariantDraft) => {
    setCategories((prev) =>
      prev.map((category) => {
        if (category.id !== categoryId) return category;
        const variant_key = nextVariantKey(category.emails);
        const sent = estimateCampaignReach(draft.agentTypes);
        const newEmail: SampleEmail = {
          id: `${categoryId}-email-${variant_key.toLowerCase()}-${Date.now()}`,
          variant_key,
          subject: draft.subject.trim(),
          preview_body: draft.preview_body.trim(),
          funnel: { sent, opened: 0, clicked: 0, attached: 0 },
          is_winner: false,
          booking_link: draft.bookingLink?.trim() || undefined,
        };
        return { ...category, emails: [...category.emails, newEmail] };
      })
    );
    setStatusMessage(draft.scheduleMode === "later" ? "Scheduled" : "Queued");
  }, []);

  const clearStatusMessage = useCallback(() => setStatusMessage(null), []);

  const sectionIds = useMemo(() => categories.map((c) => c.id), [categories]);

  return {
    categories,
    sectionIds,
    isLoading: false,
    error: null as string | null,
    addVariant,
    statusMessage,
    clearStatusMessage,
  };
}

export type { CampaignCategoryId, CategoryCampaign, SampleEmail };
