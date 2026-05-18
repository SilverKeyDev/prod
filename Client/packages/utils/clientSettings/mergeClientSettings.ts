import type { components } from "packages/types/api.generated";

import { defaultClientSettings } from "./defaultClientSettings";

type ClientSettings = components["schemas"]["ClientSettings"];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

export function deepMergeRecords(
  base: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (v === null) {
      delete out[k];
      continue;
    }
    const prev = out[k];
    if (isPlainObject(prev) && isPlainObject(v)) {
      out[k] = deepMergeRecords(prev, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function mergeClientSettingsDeep(
  base: ClientSettings,
  patch: Partial<ClientSettings>
): ClientSettings {
  return deepMergeRecords(
    base as unknown as Record<string, unknown>,
    patch as unknown as Record<string, unknown>
  ) as ClientSettings;
}

export function hydrateClientSettings(raw: ClientSettings | null | undefined): ClientSettings {
  const d = defaultClientSettings();
  if (!raw) return d;
  return mergeClientSettingsDeep(d, raw);
}
