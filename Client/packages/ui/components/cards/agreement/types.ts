/**
 * Types for the AgreementCard component.
 * AgreementData extends DocumentData with agreement-specific fields.
 */

import type { DocumentData } from "packages/ui/components/cards/document/types";

export type ContextualAgreementStatus =
  | "sign_now"
  | "waiting_for_signature"
  | "waiting_for_review"
  | "draft"
  | "sent"
  | "delivered"
  | "signed"
  | "completed"
  | "voided"
  | "declined";

export interface AgreementData extends DocumentData {
  /** Participants array from the agreement (needed for contextual status). */
  participants?: Array<{
    user_id?: string;
    role?: string;
    routing_order?: number;
    recipient_status?: string;
    signed_at?: string | null;
  }>;
  /** The agreement's agent_id. */
  agent_id?: string;
  /** The agreement's buyer_id. */
  buyer_id?: string;
}

export interface AgreementCardExternalActionHandlers {
  handleViewDocument: (documentId: string, documentName: string) => void;
  handleDownloadDocument: (
    documentId: string,
    documentName: string,
  ) => Promise<void>;
  handleShareDocument: (
    documentId: string,
    documentName: string,
  ) => Promise<{ success: boolean; message: string }>;
  handleSignNow?: (document: AgreementData) => void;
}

export interface AgreementCardProps {
  doc: AgreementData;
  onDelete?: (doc: AgreementData) => void;
  showDelete?: boolean;
  externalActionHandlers?: AgreementCardExternalActionHandlers;
  viewerUserId?: string;
  isAgent?: boolean;
}
