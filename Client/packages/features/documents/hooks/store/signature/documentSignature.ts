import type { DocumentData } from "packages/features/documents/hooks/data/useDocumentsData";

function stripFileExtension(fileName: string): string {
  const normalized = fileName.trim();
  if (!normalized) return "";
  const dotIndex = normalized.lastIndexOf(".");
  if (dotIndex <= 0) return normalized;
  return normalized.slice(0, dotIndex);
}

export function getDefaultAgreementTitle(document: DocumentData): string {
  if (document.library_kind === "agreement" && document.filename.trim().length > 0) {
    return document.filename;
  }
  return stripFileExtension(document.filename) || "Untitled agreement";
}

export function canSendForSignature(document: DocumentData): boolean {
  if (document.library_kind === "agreement") {
    const status = document.status.toLowerCase();
    return status === "draft";
  }
  return true;
}

export function sendForSignatureDisabledReason(document: DocumentData): string | null {
  if (document.library_kind !== "agreement") return null;
  if (!canSendForSignature(document)) {
    return `Agreement in ${document.status} state cannot be sent`;
  }
  return null;
}
