// Provider-agnostic agreement domain types used by the documents UI.
// These model generic real-estate agreements and related metadata.

export type AgreementStatus =
  | "draft"
  | "sent"
  | "delivered"
  | "signed"
  | "completed"
  | "voided"
  | "declined";

export type AgreementParticipantStatus = "sent" | "delivered" | "signed" | "declined";

export type AgreementParticipant = {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  status?: AgreementParticipantStatus | null;
  signed_at?: string | null;
  declined_reason?: string | null;
  signing_order: number;
};

export type AgreementRevision = {
  id: string;
  file_name: string;
  file_size: number;
  revision_number: number;
  created_at: string;
  created_by_name?: string | null;
  notes?: string | null;
};

export type AgreementType =
  | "buyer_representation"
  | "listing"
  | "purchase_contract"
  | "lease"
  | string;

export type Agreement = {
  id: string;
  title: string;
  status: AgreementStatus;
  agreement_type: AgreementType;
  buyer_id?: string | null;
  property_address?: string | null;
  created_at: string;
  sent_at?: string | null;
  completed_at?: string | null;
  voided_at?: string | null;
  void_reason?: string | null;
  description?: string | null;
  participants?: AgreementParticipant[];
  revisions?: AgreementRevision[];
};
