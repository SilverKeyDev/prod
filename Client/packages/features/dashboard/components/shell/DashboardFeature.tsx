import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import type { AgentClient } from "packages/api";
import { mapTodosToAgendaDTO } from "packages/features/agent";
import {
  loadClientHubModule,
  loadClientListModule,
} from "packages/features/agent/components/loading/agentDashboardDynamicImports";
import type { AgendaTodoDTO } from "packages/features/calendar/types/agenda";
import { useDocumentsDataIntegration } from "packages/features/documents";
import { useActiveWorkspace } from "packages/features/homeauth";
import { submitAgentAgendaTodo } from "packages/hooks/data/agenda/agentAgendaTodoSubmit";
import {
  useCompletedSigningTodos,
  useSigningTodos,
} from "packages/hooks/data/agenda/useSigningTodos";
import { useFirstRenderCommitTimer } from "packages/hooks/ui";
import { log } from "packages/logger";
import { useNavigation } from "packages/navigation";
import type { UIState } from "packages/store";
import { useUIStore } from "packages/store";
import Button from "packages/ui/components/button/Button";
import { Box } from "packages/ui/components/primitives";
import { buildClientHubPath, parseClientHubPathname } from "packages/utils/dashboard";
import { stripWorkspaceShellPrefix } from "packages/utils/layout/dashboardLayoutConfig";
import { traceLazyImport } from "packages/utils/perf/shellRouteLoadTiming";

import { useAgentTodos } from "@/features/agent/hooks/data/clientHub/useAgentTodos";
import { useCalendarOAuthCallback } from "@/features/calendar/hooks/data";
import { useGoogleCalendarStoreIntegration } from "@/features/calendar/hooks/store/useGoogleCalendarStoreIntegration";

import {
  loadDashboardAgreementSigningModalsModule,
  loadDashboardCalendarPanelModule,
  loadDashboardChecklistsModule,
  loadUpcomingEventsModule,
} from "./dashboardFeatureDynamicImports";

// Lazy-loaded so the dashboard shell can commit before the agenda/calendar subtree
// (EventList, modals, useUpcomingEventsData, etc.) is parsed and rendered.
const UpcomingEventsLazy = lazy(
  traceLazyImport("DASHBOARD", "lazy:UpcomingEvents", () =>
    loadUpcomingEventsModule().then((m) => ({ default: m.UpcomingEvents }))
  )
);

// Lazy-loaded so the dashboard shell (upcoming events) can render before the
// agent-only client list / client-only checklists chunks finish loading.
// Loaders are memoized in dashboardFeatureDynamicImports so route prefetch hits
// the same import() promise as React.lazy.
const ClientList = lazy(traceLazyImport("DASHBOARD", "lazy:ClientList", loadClientListModule));
const ClientHubScreenLazy = lazy(
  traceLazyImport("DASHBOARD", "lazy:ClientHubScreen", () =>
    loadClientHubModule().then((m) => ({ default: m.ClientHubScreen }))
  )
);
const DashboardChecklists = lazy(
  traceLazyImport("DASHBOARD", "lazy:DashboardChecklists", loadDashboardChecklistsModule)
);
const DashboardAgreementSigningModals = lazy(
  traceLazyImport(
    "DASHBOARD",
    "lazy:DashboardAgreementSigningModals",
    loadDashboardAgreementSigningModalsModule
  )
);
const DashboardCalendarPanel = lazy(
  traceLazyImport("DASHBOARD", "lazy:DashboardCalendarPanel", loadDashboardCalendarPanelModule)
);

const dashboardCalendarSkeleton = (
  <Box className="bg-muted/50 h-56 w-full animate-pulse rounded-xl md:h-72" />
);

const dashboardSectionSkeleton = (
  <Box className="bg-muted/50 h-40 w-full animate-pulse rounded-xl md:h-56" />
);

type DashboardFeatureProps = {
  setMobileHeaderActions?: React.Dispatch<React.SetStateAction<React.ReactNode | null>>;
};

export function DashboardFeature({ setMobileHeaderActions }: DashboardFeatureProps) {
  useFirstRenderCommitTimer("DASHBOARD", "DashboardFeature");
  const { navigateToPath, getCurrentRoute } = useNavigation();
  const isAgentWorkspace = useActiveWorkspace() === "agent";
  const queryClient = useQueryClient();
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  useCalendarOAuthCallback({ enqueueToast });

  const { todos, createTodo, updateTodo } = useAgentTodos(false);
  const signingTodos = useSigningTodos(isAgentWorkspace);
  const completedSigningTodos = useCompletedSigningTodos();
  const {
    documents,
    signAgreementNow,
    agreementSigningSession,
    dismissAgreementSigning,
    onAgreementSigningComplete,
  } = useDocumentsDataIntegration();
  const { isConnected, calendars, refreshEvents } = useGoogleCalendarStoreIntegration();
  const [createEventModalOpen, setCreateEventModalOpen] = useState(false);

  const scopedCalendars = useMemo(() => calendars ?? [], [calendars]);

  const agendaTodos = useMemo<AgendaTodoDTO[]>(
    () => [...mapTodosToAgendaDTO(todos), ...signingTodos, ...completedSigningTodos],
    [todos, signingTodos, completedSigningTodos]
  );

  const handleToggleAgendaTodo = async (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) {
      return;
    }
    try {
      await updateTodo(id, { completed: !todo.completed });
    } catch (error) {
      log.error("DASHBOARD", "Failed to update todo", error);
    }
  };

  const handleSigningAgendaPress = useCallback(
    async (agreementId: string) => {
      const doc = documents.find((d) => d.id === agreementId && d.library_kind === "agreement");
      if (!doc) {
        enqueueToast({
          type: "error",
          message: "Could not open that document. Try refreshing the page.",
        });
        return;
      }
      try {
        await signAgreementNow(doc);
      } catch (error) {
        log.error("ERRORS", "Agenda DocuSign signing failed", error);
        enqueueToast({
          type: "error",
          message: error instanceof Error ? error.message : "Signing could not start.",
        });
      }
    },
    [documents, enqueueToast, signAgreementNow]
  );

  const defaultCalendarId = scopedCalendars[0]?.id ?? null;

  const canAddGoogleCalendarItem = Boolean(isConnected && defaultCalendarId);
  const showAddButton = isAgentWorkspace || canAddGoogleCalendarItem || !isAgentWorkspace;

  const headerActions = showAddButton ? (
    <Box className="flex flex-wrap items-center justify-end gap-2">
      <Button
        variant="primary"
        size="sm"
        iconName="plus"
        aria-haspopup="dialog"
        onPress={() => setCreateEventModalOpen(true)}
      >
        Add
      </Button>
    </Box>
  ) : undefined;

  useEffect(() => {
    if (setMobileHeaderActions) {
      setMobileHeaderActions(null);
    }
    return () => {
      if (setMobileHeaderActions) {
        setMobileHeaderActions(null);
      }
    };
  }, [setMobileHeaderActions]);

  const handleClientClick = (client: Pick<AgentClient, "id" | "name">) => {
    navigateToPath(buildClientHubPath(client.id, client.name));
  };

  const clientHubRoute = parseClientHubPathname(
    stripWorkspaceShellPrefix(getCurrentRoute().pathname)
  );

  if (clientHubRoute) {
    return (
      <Suspense fallback={dashboardSectionSkeleton}>
        <ClientHubScreenLazy />
      </Suspense>
    );
  }

  return (
    <>
      <Box className="flex flex-col gap-6 sm:gap-8">
        <Suspense fallback={dashboardSectionSkeleton}>
          <UpcomingEventsLazy
            suppressConnectionPrompt
            agendaTodos={agendaTodos}
            onToggleAgendaTodo={handleToggleAgendaTodo}
            canEditAgendaTodos={true}
            onSigningAgendaPress={handleSigningAgendaPress}
            headerActions={headerActions}
          />
        </Suspense>

        {isAgentWorkspace ? (
          <Suspense fallback={dashboardSectionSkeleton}>
            <ClientList onClientClick={handleClientClick} />
          </Suspense>
        ) : null}

        {!isAgentWorkspace ? (
          <Suspense fallback={dashboardSectionSkeleton}>
            <DashboardChecklists />
          </Suspense>
        ) : null}

        <Suspense fallback={dashboardCalendarSkeleton}>
          <DashboardCalendarPanel
            showAddButton={showAddButton}
            createEventModalOpen={createEventModalOpen}
            setCreateEventModalOpen={setCreateEventModalOpen}
            scopedCalendars={scopedCalendars}
            defaultCalendarId={defaultCalendarId}
            refreshEvents={refreshEvents}
            onAddWithoutSchedule={async (payload) => {
              try {
                await submitAgentAgendaTodo(
                  {
                    title: payload.title,
                    description: payload.description,
                    deadlineDate: null,
                    deadlineTime: null,
                    clientId: isAgentWorkspace ? payload.clientId : undefined,
                  },
                  {
                    useCalendarEvent: false,
                    defaultCalendarId,
                    createTodo,
                    queryClient,
                  }
                );
              } catch (error) {
                log.error("DASHBOARD", "Failed to create agenda to-do", error);
                throw error;
              }
            }}
          />
        </Suspense>
      </Box>
      {agreementSigningSession ? (
        <Suspense fallback={null}>
          <DashboardAgreementSigningModals
            agreementSigningSession={agreementSigningSession}
            dismissAgreementSigning={dismissAgreementSigning}
            onAgreementSigningComplete={onAgreementSigningComplete}
          />
        </Suspense>
      ) : null}
    </>
  );
}
