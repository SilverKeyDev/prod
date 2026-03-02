/**
 * Human-readable preview for a chat message (e.g. sidebar snippet).
 * Handles event requests, shared homes, shared documents, and plain text.
 */

const EVENT_REQUEST_PREFIX = "__EVENT_REQUEST__";
const PREVIEW_MAX_LENGTH = 60;

export type MessagePreviewInput = {
  content: string;
  shared_home_id?: string | null;
  shared_document_id?: string | null;
};

/**
 * Returns a short preview string for a message so sidebars don't show raw payloads.
 * - Shared home → "Shared a home"
 * - Shared document → "Shared a document"
 * - Event request (__EVENT_REQUEST__{...}) → "Event: {title}"
 * - Plain text → trimmed content, truncated to PREVIEW_MAX_LENGTH
 */
export function getMessagePreview(msg: MessagePreviewInput): string {
  if (msg.shared_home_id) {
    return "Shared a home";
  }
  if (msg.shared_document_id) {
    return "Shared a document";
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
        return title ? `Event: ${title}` : "Event request";
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
