import { getTaskChecklist } from "packages/features/checklists/api/checklists";
import type { RouteConfig } from "packages/services/data/dataRouteTypes";

export const checklistRoutes = {
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
