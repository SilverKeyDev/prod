import type { AgentClient } from "packages/api";

export function agentClientKindTranslationKey(kind: AgentClient["client_kind"]): string {
  switch (kind) {
    case "buyer":
      return "agent.client_kind.buyer";
    case "seller":
      return "agent.client_kind.seller";
    case "investor":
      return "agent.client_kind.investor";
    default:
      return "agent.client_kind.unknown";
  }
}

export function pipelineStageTranslationKey(stage: AgentClient["pipeline_stage"]): string {
  const s = stage ?? "search";
  const keys: Record<string, string> = {
    search: "agent.pipeline_stage.search",
    offer: "agent.pipeline_stage.offer",
    escrow: "agent.pipeline_stage.escrow",
    financing: "agent.pipeline_stage.financing",
    closing: "agent.pipeline_stage.closing",
    insurance: "agent.pipeline_stage.insurance",
    unknown: "agent.pipeline_stage.unknown",
  };
  return keys[s] ?? "agent.pipeline_stage.search";
}
