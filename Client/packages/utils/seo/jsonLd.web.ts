import { getDocument } from "packages/utils/core/platform";

/**
 * Replace or remove a JSON-LD script node by id (stable across client navigations).
 */
export function setJsonLdScript(scriptId: string, data: Record<string, unknown> | null): void {
  const doc = getDocument();
  if (!doc) return;

  const existing = doc.getElementById(scriptId);
  if (existing?.parentNode) {
    existing.parentNode.removeChild(existing);
  }
  if (data === null) return;

  const script = doc.createElement("script");
  script.type = "application/ld+json";
  script.id = scriptId;
  script.textContent = JSON.stringify(data);
  doc.head.appendChild(script);
}
