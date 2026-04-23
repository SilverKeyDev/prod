import type { components } from "packages/types/api.generated";

// Keep aligned with Server/app/services/client_settings/state.py default_settings()

export type ClientSettings = components["schemas"]["ClientSettings"];

export function defaultClientSettings(): ClientSettings {
  return {
    v: 1,
    library: {
      homes: { layout: "grid", sort: "date_desc" },
      documents: { layout: "grid", sort: "date_desc" },
      docusign: { layout: "grid", sort: "date_desc" },
    },
    saved: { tab: "homes" },
    calendar: { shell: "month", availability: "week" },
  };
}
