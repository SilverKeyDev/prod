import type {
  Agreement,
  AgreementParticipant,
  AgreementType,
} from "@/features/documents/types/agreements";

type SigningProgress = {
  signed: number;
  total: number;
  percentage: number;
};

export function calculateSigningProgress(
  participants?: AgreementParticipant[] | null
): SigningProgress {
  const list = participants ?? [];
  if (list.length === 0) {
    return { signed: 0, total: 0, percentage: 0 };
  }
  const signed = list.filter((p) => p.status === "signed").length;
  const total = list.length;
  const percentage = Math.round((signed / Math.max(total, 1)) * 100);
  return { signed, total, percentage };
}

export function canUserSend(agreement: Agreement, userId: string, isAgent: boolean): boolean {
  if (!userId || !isAgent) {
    return false;
  }
  return agreement.status === "draft";
}

export function canUserVoid(agreement: Agreement, userId: string, isAgent: boolean): boolean {
  if (!userId || !isAgent) {
    return false;
  }
  return (
    agreement.status === "sent" || agreement.status === "delivered" || agreement.status === "signed"
  );
}

export function formatAgreementDate(value?: string | null): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatAgreementDateTime(value?: string | null): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getAgreementTypeLabel(type: AgreementType): string {
  switch (type) {
    case "buyer_representation":
      return "Buyer Representation";
    case "listing":
      return "Listing Agreement";
    case "purchase_contract":
      return "Purchase Contract";
    case "lease":
      return "Lease Agreement";
    default:
      return String(type)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function formatParticipantRole(role?: string | null): string {
  if (!role) {
    return "Participant";
  }
  return role
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getParticipantStatusColor(status?: string | null): string {
  switch (status) {
    case "signed":
      return "text-green-700";
    case "declined":
      return "text-red-700";
    case "delivered":
    case "sent":
      return "text-blue-700";
    default:
      return "text-gray-700";
  }
}
