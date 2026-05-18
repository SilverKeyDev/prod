import { describe, expect, it } from "vitest";

import type { AgentClient } from "packages/api";

import { buildClientListSubtitle } from "./buildClientListSubtitle";

const t = (key: string) =>
  (
    ({
      "agent.pipeline_stage.insurance": "Insurance",
      "agent.pipeline_stage.unknown": "—",
    }) as Record<string, string>
  )[key] ?? key;

describe("buildClientListSubtitle", () => {
  it("returns phase icon, title, and step label", () => {
    const client = {
      current_phase: "search",
      current_step_label: "Sign buyer-broker representation agreement",
    } as Pick<AgentClient, "current_phase" | "pipeline_stage" | "current_step_label">;

    const parts = buildClientListSubtitle(client, t);
    expect(parts.iconName).toBe("search");
    expect(parts.phaseLabel).toBe("Search");
    expect(parts.stepLabel).toBe("Sign buyer-broker representation agreement");
  });

  it("returns null step label when no incomplete step", () => {
    const client = {
      current_phase: "search",
      current_step_label: null,
    } as Pick<AgentClient, "current_phase" | "pipeline_stage" | "current_step_label">;

    const parts = buildClientListSubtitle(client, t);
    expect(parts.stepLabel).toBeNull();
  });
});
