/**
 * Checklist integration entry for agent search UI. Lives in hooks so checklist feature
 * does not import `packages/features/agent/components/*` (eslint), without using the
 * agent barrel (avoids pulling AgentFeature into madge cycles).
 */
export {
  AgentSearchContent,
  type AgentSearchContentProps,
} from "packages/features/agent/components/AgentSearchContent";
