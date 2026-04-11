/**
 * Re-export checklist hook for homeauth consumers (e.g. AgentFeature).
 * Re-export from the hook module directly—not the checklists barrel—to avoid pulling
 * ChecklistIntegrationSlot → PartnerAgentSection → agent into the same graph as
 * agent/index (madge circular dependency).
 */
export {
  type ChecklistType,
  useChecklistData,
  type UseChecklistDataReturn,
} from "packages/features/checklists/hooks/data/useChecklistData";
