/**
 * Human-readable preview for a chat message (e.g. sidebar snippet).
 * Handles event requests, shared homes, shared documents, and plain text.
 */

import type { MessagePreviewInput } from "packages/features/messaging/types/messagePreview";

import { getAgreementEventPreviewLabel, parseAgreementEventPayload } from "./agreementEventPayload";
import { parseSharedAttachmentSnapshot } from "./sharedAttachmentSnapshot";

export type { MessagePreviewInput } from "packages/features/messaging/types/messagePreview";

const EVENT_REQUEST_PREFIX = "__EVENT_REQUEST__";
const PREVIEW_MAX_LENGTH = 60;

/**
 * Returns a short preview string for a message so sidebars don't show raw payloads.
 * - Shared home → "Shared a home"
 * - Shared document → "Shared a document"
 * - Agreement event (__AGREEMENT_EVENT__{...}) → short status label, optional ": {title}"
 * - Event request (__EVENT_REQUEST__{...}) → "Event: {title}"
 * - Plain text → trimmed content, truncated to PREVIEW_MAX_LENGTH
 */
export function getMessagePreview(msg: MessagePreviewInput): string {
  const snapshot = parseSharedAttachmentSnapshot(msg.content);
  if (snapshot?.kind === "bundle") {
    const line = snapshot.displayLine.trim();
    if (line) {
      if (line.length <= PREVIEW_MAX_LENGTH) return line;
      return `${line.slice(0, PREVIEW_MAX_LENGTH - 3)}...`;
    }
    const n = snapshot.items.length;
    const homeN = snapshot.items.filter((i) => i.type === "home").length;
    const docN = snapshot.items.filter((i) => i.type === "document").length;
    if (homeN > 0 && docN === 0) return n > 1 ? `Shared ${homeN} homes` : "Shared homes";
    if (docN > 0 && homeN === 0) return n > 1 ? `Shared ${docN} documents` : "Shared document";
    return "Shared bundle";
  }
  if (snapshot?.kind === "home") {
    const line = snapshot.displayLine.trim();
    if (!line) return "Shared home";
    if (line.length <= PREVIEW_MAX_LENGTH) return `Shared home: ${line}`;
    return `Shared home: ${line.slice(0, PREVIEW_MAX_LENGTH - 3)}...`;
  }
  if (snapshot?.kind === "document") {
    const line = snapshot.displayLine.trim();
    if (!line) return "Shared document";
    if (line.length <= PREVIEW_MAX_LENGTH) return `Shared document: ${line}`;
    return `Shared document: ${line.slice(0, PREVIEW_MAX_LENGTH - 3)}...`;
  }
  if (snapshot?.kind === "checklist_form") {
    const line = snapshot.displayLine.trim();
    if (!line) return "Shared form";
    if (line.length <= PREVIEW_MAX_LENGTH) return `Shared form: ${line}`;
    return `Shared form: ${line.slice(0, PREVIEW_MAX_LENGTH - 3)}...`;
  }

  const agreementPayload = parseAgreementEventPayload(msg.content);
  if (agreementPayload) {
    const label = getAgreementEventPreviewLabel(agreementPayload.event);
    const line = agreementPayload.title.trim();
    if (!line) return label;
    const withTitle = `${label}: ${line}`;
    if (withTitle.length <= PREVIEW_MAX_LENGTH) return withTitle;
    return `${withTitle.slice(0, PREVIEW_MAX_LENGTH - 3)}...`;
  }

  if (msg.shared_home_id) {
    return "Shared home";
  }
  if (msg.shared_document_id) {
    return "Shared document";
  }
  const content = (msg.content ?? "").trim();
  if (!content) {
    return "";
  }
  if (content.startsWith(EVENT_REQUEST_PREFIX)) {
    const afterPrefix = content.slice(EVENT_REQUEST_PREFIX.length).trim();
    const jsonStr = afterPrefix.split("\n")[0];
    try {
      const parsed = JSON.parse(jsonStr) as unknown;
      if (
        parsed &&
        typeof parsed === "object" &&
        "title" in parsed &&
        typeof (parsed as { title: string }).title === "string"
      ) {
        const title = (parsed as { title: string }).title.trim();
        return title ? `Event request: ${title}` : "Event request";
      }
    } catch {
      // Invalid JSON
    }
    return "Event request";
  }
  const firstLine = content.split("\n")[0].trim();
  if (firstLine.length <= PREVIEW_MAX_LENGTH) {
    return firstLine;
  }
  return `${firstLine.slice(0, PREVIEW_MAX_LENGTH - 3)}...`;
}
