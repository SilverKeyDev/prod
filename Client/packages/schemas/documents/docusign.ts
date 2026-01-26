// DocuSign-related type definitions

// Enums
export type AgreementStatus =
  | "draft"
  | "sent"
  | "delivered"
  | "signed"
  | "completed"
  | "voided"
  | "declined";

export type AgreementType =
  | "buyer_representation"
  | "offer"
  | "inspection_addendum"
  | "financing_contingency"
  | "closing_disclosure"
  | "other";

export type ParticipantRole = "agent" | "buyer" | "seller" | "other";

export type SigningMethod = "embedded" | "email";

export type ParticipantStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "signed"
  | "completed"
  | "declined";

// Core Entity Types
export type Agreement = {
  id: string;
  agent_id: string;
  buyer_id: string;
  title: string;
  agreement_type: AgreementType;
  status: AgreementStatus;
  property_address?: string;
  description?: string;
  envelope_id?: string;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  completed_at?: string;
  voided_at?: string;
  void_reason?: string;
  // Relationships (when include_relationships=True)
  participants?: AgreementParticipant[];
  revisions?: AgreementRevision[];
  events?: AgreementEvent[];
  // Additional fields from backend
  agent_name?: string;
  buyer_name?: string;
  buyer_email?: string;
};

export type AgreementRevision = {
  id: string;
  agreement_id: string;
  revision_number: number;
  file_name: string;
  file_size: number;
  s3_key: string;
  created_by: string;
  notes?: string;
  created_at: string;
  // Additional fields
  created_by_name?: string;
};

export type AgreementParticipant = {
  id: string;
  agreement_id: string;
  user_id?: string;
  email: string;
  name: string;
  role: ParticipantRole;
  recipient_id?: string;
  status: ParticipantStatus;
  signing_order: number;
  signed_at?: string;
  declined_reason?: string;
  created_at: string;
  updated_at: string;
};

export type AgreementEvent = {
  id: string;
  agreement_id: string;
  event_type: string;
  status?: AgreementStatus;
  actor_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  // Additional fields
  actor_name?: string;
};

export type DocusignTemplate = {
  id: string;
  template_id: string;
  name: string;
  description?: string;
  agreement_type?: AgreementType;
  is_active: boolean;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
};

// API Request Types
export type CreateAgreementRequest = {
  title: string;
  agreement_type: AgreementType;
  buyer_id: string;
  property_address?: string;
  description?: string;
};

export type SendAgreementRequest = {
  signing_method?: SigningMethod;
};

export type VoidAgreementRequest = {
  reason?: string;
};

export type GetSigningUrlRequest = {
  participant_id: string;
};

// API Response Types
export type CreateAgreementResponse = {
  success: boolean;
  agreement?: Agreement;
  message?: string;
  error?: string;
};

export type GetAgreementResponse = {
  success: boolean;
  agreement?: Agreement;
  message?: string;
  error?: string;
};

export type ListAgreementsResponse = {
  success: boolean;
  agreements?: Agreement[];
  message?: string;
  error?: string;
};

export type CreateRevisionResponse = {
  success: boolean;
  revision?: AgreementRevision;
  message?: string;
  error?: string;
};

export type SendAgreementResponse = {
  success: boolean;
  task_id?: string;
  message?: string;
  error?: string;
};

export type VoidAgreementResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export type GetSigningUrlResponse = {
  success: boolean;
  signing_url?: string;
  message?: string;
  error?: string;
};

export type ListTemplatesResponse = {
  success: boolean;
  templates?: DocusignTemplate[];
  message?: string;
  error?: string;
};

export type SyncTemplatesResponse = {
  success: boolean;
  task_id?: string;
  message?: string;
  error?: string;
};

export type OAuthStartResponse = {
  success: boolean;
  auth_url?: string;
  message?: string;
  error?: string;
};
