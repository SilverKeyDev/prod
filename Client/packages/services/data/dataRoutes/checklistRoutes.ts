import {
  type ChecklistType,
  getTaskChecklistForSubject,
  getTaskChecklistProgressSummaryForSubject,
  tryResolveMyTransactionId,
} from "packages/features/checklists/api/checklists";
import type { RouteConfig } from "packages/services/data/dataRouteTypes";
import type { UserProfile } from "packages/types";

async function fetchChecklistForType(type: ChecklistType, _user: UserProfile | null) {
  const transactionId = await tryResolveMyTransactionId();
  if (!transactionId) {
    return null;
  }
  return getTaskChecklistForSubject(transactionId, type);
}

async function fetchChecklistProgressSummary(_user: UserProfile | null) {
  const transactionId = await tryResolveMyTransactionId();
  if (!transactionId) {
    return null;
  }
  return getTaskChecklistProgressSummaryForSubject(transactionId);
}

export const checklistRoutes = {
  checklistProgressSummary: {
    key: "checklistProgressSummary",
    queryKey: () => ["checklists", "progress-summary", "pending"] as const,
    queryFn: fetchChecklistProgressSummary,
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },

  checklistSearch: {
    key: "checklistSearch",
    queryKey: () => ["checklists", "search", "pending"] as const,
    queryFn: (user) => fetchChecklistForType("search", user),
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },

  checklistOffer: {
    key: "checklistOffer",
    queryKey: () => ["checklists", "offer", "pending"] as const,
    queryFn: (user) => fetchChecklistForType("offer", user),
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },

  checklistEscrow: {
    key: "checklistEscrow",
    queryKey: () => ["checklists", "escrow", "pending"] as const,
    queryFn: (user) => fetchChecklistForType("escrow", user),
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },

  checklistFinancing: {
    key: "checklistFinancing",
    queryKey: () => ["checklists", "financing", "pending"] as const,
    queryFn: (user) => fetchChecklistForType("financing", user),
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },

  checklistClosing: {
    key: "checklistClosing",
    queryKey: () => ["checklists", "closing", "pending"] as const,
    queryFn: (user) => fetchChecklistForType("closing", user),
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },

  checklistInsurance: {
    key: "checklistInsurance",
    queryKey: () => ["checklists", "insurance", "pending"] as const,
    queryFn: (user) => fetchChecklistForType("insurance", user),
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },
} as const satisfies Record<string, RouteConfig>;
