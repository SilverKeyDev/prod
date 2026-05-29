import {
  getTaskChecklist,
  getTaskChecklistProgressSummary,
} from "packages/features/checklists/api/checklists";
import type { RouteConfig } from "packages/services/data/dataRouteTypes";

export const checklistRoutes = {
  checklistProgressSummary: {
    key: "checklistProgressSummary",
    queryKey: () => ["checklists", "progress-summary"],
    queryFn: async () => getTaskChecklistProgressSummary(),
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },

  checklistSearch: {
    key: "checklistSearch",
    queryKey: () => ["checklists", "search"],
    queryFn: async () => getTaskChecklist("search"),
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },

  checklistOffer: {
    key: "checklistOffer",
    queryKey: () => ["checklists", "offer"],
    queryFn: async () => getTaskChecklist("offer"),
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },

  checklistEscrow: {
    key: "checklistEscrow",
    queryKey: () => ["checklists", "escrow"],
    queryFn: async () => getTaskChecklist("escrow"),
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },

  checklistFinancing: {
    key: "checklistFinancing",
    queryKey: () => ["checklists", "financing"],
    queryFn: async () => getTaskChecklist("financing"),
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },

  checklistClosing: {
    key: "checklistClosing",
    queryKey: () => ["checklists", "closing"],
    queryFn: async () => getTaskChecklist("closing"),
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },

  checklistInsurance: {
    key: "checklistInsurance",
    queryKey: () => ["checklists", "insurance"],
    queryFn: async () => getTaskChecklist("insurance"),
    shouldPoll: false,
    staleTime: 5 * 60 * 1000,
    userType: "all",
    initialLoad: true,
  },
} as const satisfies Record<string, RouteConfig>;
