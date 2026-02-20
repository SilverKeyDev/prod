import {
  CheckCircle2,
  Clock,
  FileSignature,
  Mail,
  SendHorizontal,
  XCircle,
} from "lucide-react";

import type {
  AgreementParticipant,
  AgreementStatus,
} from "packages/schemas/content/documents/docusign";

export function getStatusIcon(status: AgreementStatus) {
  const icons: Record<AgreementStatus, typeof FileSignature> = {
    draft: FileSignature,
    sent: SendHorizontal,
    delivered: Mail,
    signed: FileSignature,
    completed: CheckCircle2,
    voided: XCircle,
    declined: XCircle,
  };
  return icons[status];
}

export function getParticipantStatusIcon(
  status: AgreementParticipant["status"],
) {
  const icons: Record<AgreementParticipant["status"], typeof Clock> = {
    pending: Clock,
    sent: SendHorizontal,
    delivered: Mail,
    signed: CheckCircle2,
    completed: CheckCircle2,
    declined: XCircle,
  };
  return icons[status];
}
