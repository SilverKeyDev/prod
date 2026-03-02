/**
 * Hook that exposes agent dashboard mock data helpers.
 * Wraps packages/services/agent/agentDashboard so components use hooks only.
 */
import { useCallback } from "react";

import type { AgentClient } from "packages/config/api";

import type {
  AgentNote,
  ClientDealInfo,
  ClientFinancialSnapshot,
  ClientGoals,
  ClientTimelineEvent,
  DealStage,
  DecisionLogEntry,
} from "@/features/agent/types/agent";
import {
  enhanceClientWithDealInfo as enhanceClientWithDealInfoImpl,
  generateMockClientGoals as generateMockClientGoalsImpl,
  generateMockDecisionLog as generateMockDecisionLogImpl,
  generateMockFinancialSnapshot as generateMockFinancialSnapshotImpl,
  generateMockNotes as generateMockNotesImpl,
  generateMockTimelineEvents as generateMockTimelineEventsImpl,
} from "@/features/agent/utils/agentDashboard";

export function useAgentDashboardMockData() {
  const enhanceClientWithDealInfo = useCallback(
    (client: AgentClient, dealStage: DealStage = "search"): ClientDealInfo =>
      enhanceClientWithDealInfoImpl(client, dealStage),
    []
  );

  const generateMockFinancialSnapshot = useCallback(
    (): ClientFinancialSnapshot => generateMockFinancialSnapshotImpl(),
    []
  );

  const generateMockClientGoals = useCallback((): ClientGoals => generateMockClientGoalsImpl(), []);

  const generateMockDecisionLog = useCallback(
    (clientId: string): DecisionLogEntry[] => generateMockDecisionLogImpl(clientId),
    []
  );

  const generateMockNotes = useCallback(
    (clientId: string): AgentNote[] => generateMockNotesImpl(clientId),
    []
  );

  const generateMockTimelineEvents = useCallback(
    (clientId: string): ClientTimelineEvent[] => generateMockTimelineEventsImpl(clientId),
    []
  );

  return {
    enhanceClientWithDealInfo,
    generateMockFinancialSnapshot,
    generateMockClientGoals,
    generateMockDecisionLog,
    generateMockNotes,
    generateMockTimelineEvents,
  };
}
