/**
 * Replace or remove a JSON-LD script node by id (stable across client navigations).
 */
export function setJsonLdScript(scriptId: string, data: Record<string, unknown> | null): void {
  const existing = document.getElementById(scriptId);
  if (existing?.parentNode) {
    existing.parentNode.removeChild(existing);
  }
  if (data === null) return;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = scriptId;
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}
