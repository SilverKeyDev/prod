import { describe, expect, it } from "vitest";

import type { AgentClient } from "packages/api";

import {
  agentClientKindTranslationKey,
  pipelineStageTranslationKey,
} from "./agentClientListLabels";

describe("agentClientKindTranslationKey", () => {
  it("maps each client_kind to its feature key", () => {
    expect(agentClientKindTranslationKey("buyer")).toBe("agent.client_kind.buyer");
    expect(agentClientKindTranslationKey("seller")).toBe("agent.client_kind.seller");
    expect(agentClientKindTranslationKey("renter")).toBe("agent.client_kind.renter");
    expect(agentClientKindTranslationKey("investor")).toBe("agent.client_kind.investor");
  });

  it("maps unknown and null to unknown key", () => {
    expect(agentClientKindTranslationKey("unknown")).toBe("agent.client_kind.unknown");
    expect(agentClientKindTranslationKey(null)).toBe("agent.client_kind.unknown");
    expect(agentClientKindTranslationKey(undefined as AgentClient["client_kind"])).toBe(
      "agent.client_kind.unknown"
    );
  });
});

describe("pipelineStageTranslationKey", () => {
  it("maps each known pipeline stage", () => {
    expect(pipelineStageTranslationKey("search")).toBe("agent.pipeline_stage.search");
    expect(pipelineStageTranslationKey("offer")).toBe("agent.pipeline_stage.offer");
    expect(pipelineStageTranslationKey("escrow")).toBe("agent.pipeline_stage.escrow");
    expect(pipelineStageTranslationKey("financing")).toBe("agent.pipeline_stage.financing");
    expect(pipelineStageTranslationKey("closing")).toBe("agent.pipeline_stage.closing");
    expect(pipelineStageTranslationKey("insurance")).toBe("agent.pipeline_stage.insurance");
    expect(pipelineStageTranslationKey("unknown")).toBe("agent.pipeline_stage.unknown");
  });

  it("defaults null and undefined to search key", () => {
    expect(pipelineStageTranslationKey(null)).toBe("agent.pipeline_stage.search");
    expect(pipelineStageTranslationKey(undefined)).toBe("agent.pipeline_stage.search");
  });

  it("falls back to search for unrecognized stage strings", () => {
    expect(pipelineStageTranslationKey("not-a-stage" as AgentClient["pipeline_stage"])).toBe(
      "agent.pipeline_stage.search"
    );
  });
});
