/** SIL-309 campaign learning loop API types (aligned with SIL-306/307 payloads). */

export type CampaignSummary = {
  id: string;
  name: string;
  goal_metric?: string;
  status?: string;
  created_at?: string;
  sent_at?: string;
  recipient_count?: number;
  has_learning_result?: boolean;
  variants?: Array<{ variant_key: string; subject: string; body_template: string }>;
};

export type WinnerAnalysis = {
  winner_variant: string | null;
  winner_attach_rate?: number;
  winner_open_rate?: number;
  winner_click_rate?: number;
  drivers: string[];
  variant_insights?: Array<Record<string, unknown>>;
  model?: {
    chosen_model?: string;
    chosen_auc?: number;
    rationale?: string;
    candidates?: Array<{ name: string; auc: number; accuracy: number }>;
  };
};

export type CampaignReview = {
  source: string;
  what_worked: string[];
  what_did_not_work: string[];
  recommended_next_test?: string;
  approval_required?: boolean;
};

export type DraftVariant = {
  key: string;
  subject: string;
  body_template: string;
  cta_type?: string;
  incentive_framing?: string;
  include_meet_link?: boolean;
  subject_length?: number;
  meet_cta?: Record<string, unknown>;
};

export type NextIterationDraft = {
  source: string;
  approval_required: boolean;
  status: string;
  conditioning_summary?: string;
  variants: DraftVariant[];
  notes?: string;
};

export type CampaignLearningResult = {
  success: boolean;
  brokerage_org_id: string;
  campaign_id: string;
  campaign_name?: string;
  generated_at?: string;
  data_source?: string;
  winner_analysis: WinnerAnalysis;
  segment_predictions?: Array<{
    tenure_band: string;
    office_id: string;
    n: number;
    mean_attach_propensity: number;
  }>;
  model_metrics?: Record<string, unknown>;
  review: CampaignReview;
  next_iteration_draft: NextIterationDraft;
  guardrails?: {
    auto_send: boolean;
    approval_required: boolean;
    pii_in_prompts: boolean;
    cpu_only: boolean;
  };
};

export type CampaignResultsPayload = {
  success: boolean;
  campaign_id: string;
  name?: string;
  attach_rate_lift_pp?: number;
  recovered_dollars_total?: number;
  funnel_by_variant?: Record<
    string,
    { sent: number; opened: number; clicked: number; attached: number }
  >;
  variants?: Array<{
    variant_key: string;
    is_winner?: boolean;
    attach_rate_lift_pp?: number;
    post_attach_rate_percent?: number;
  }>;
  learning?: CampaignLearningResult | null;
};
