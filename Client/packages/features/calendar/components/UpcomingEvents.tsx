import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import Card from "packages/ui/components/cards/Card";
import { Box, Text } from "packages/ui/components/primitives";
import { dateNow, dayjs } from "packages/utils/date";

import {
  useAllAgendaEventsModalQuery,
  useGoogleCalendarPermissions,
  useGoogleEvents,
} from "@/features/calendar/hooks/data";
import { useGoogleCalendarStoreIntegration } from "@/features/calendar/hooks/store/useGoogleCalendarStoreIntegration";
import { useUpcomingAgendaHeaderActions } from "@/features/calendar/hooks/ui/useUpcomingAgendaHeaderActions";
import type { AgendaTodoDTO } from "@/features/calendar/types/agenda";
import {
  filterCalendarsToAgentOwned,
  findSilverKeyCalendar,
  getCalendarsKey,
  initializeEnabledCalendars,
} from "@/features/calendar/utils/calendar";
import {
  filterEventsByCalendars,
  filterUpcomingEvents,
} from "@/features/calendar/utils/eventFiltering";
import {
  filterTodosInRange,
  mergeUpcomingAgendaItems,
  sortCompletedAgendaTodosForDisplay,
} from "@/features/calendar/utils/mergeUpcomingAgenda";

import { AllAgendaEventsModal } from "./view/AllAgendaEventsModal";
import { CalendarConnectionPrompt } from "./view/CalendarConnectionPrompt";
import { CompletedAgendaTodosModal } from "./view/CompletedAgendaTodosModal";
import { EventList } from "./view/EventList";
import { UpcomingAgendaList } from "./view/UpcomingAgendaList";

const AGENDA_TITLE = "Agenda";

type UpcomingEventsProps = {
  /** When true, EventList renders without FlatList (for use inside another VirtualizedList). */
  embedInListHeader?: boolean;
  /** When true, omit the connect / permissions prompt when a sibling Calendar shows it below. */
  suppressConnectionPrompt?: boolean;
  /** Optional section heading; omitted when this block returns null (e.g. suppressed + disconnected). */
  sectionTitle?: string;
  /** When set (e.g. for agents), to-dos are merged into the upcoming list. Omit for non-agents. */
  agendaTodos?: AgendaTodoDTO[];
  onToggleAgendaTodo?: (id: string) => void;
  canEditAgendaTodos?: boolean;
  onSigningAgendaPress?: (agreementId: string) => void;
  headerActions?: ReactNode;
  /** Agent dashboard: only fetch/display events from calendars the user owns. */
  ownedCalendarsOnly?: boolean;
};

export function UpcomingEvents({
  embedInListHeader = false,
  suppressConnectionPrompt = false,
  sectionTitle,
  agendaTodos,
  onToggleAgendaTodo,
  canEditAgendaTodos = false,
  onSigningAgendaPress,
  headerActions,
  ownedCalendarsOnly = false,
}: UpcomingEventsProps = {}) {
  const { isConnected, calendars, calendarsLoading, connectGoogleCalendar } =
    useGoogleCalendarStoreIntegration();

  const scopedCalendars = useMemo(() => {
    if (!ownedCalendarsOnly || !calendars?.length) {
      return calendars ?? [];
    }
    return filterCalendarsToAgentOwned(calendars);
  }, [calendars, ownedCalendarsOnly]);

  const silverKeyCalendarId = useMemo(
    () => findSilverKeyCalendar(scopedCalendars)?.id ?? null,
    [scopedCalendars],
  );

  const { userPreferences } = useUserPreferences();

  const {
    permissionsLoading,
    hasRequiredPermissions,
    isPartiallyEnabled,
    permissions,
  } = useGoogleCalendarPermissions();

  const [enabledCalendarIds, setEnabledCalendarIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [completedTodosModalOpen, setCompletedTodosModalOpen] = useState(false);
  const [allAgendaEventsModalOpen, setAllAgendaEventsModalOpen] =
    useState(false);

  const initializedFromPreferencesRef = useRef(false);
  const lastCalendarsRef = useRef<string>("");
  const hadDisabledCalendarsRef = useRef(false);

  const [todayDateString, setTodayDateString] = useState(() =>
    dateNow().format("ddd MMM DD YYYY"),
  );
  const lastCheckedDateRef = useRef<string>(todayDateString);

  useEffect(() => {
    const checkDate = () => {
      const currentDateString = dateNow().format("ddd MMM DD YYYY");
      if (currentDateString !== lastCheckedDateRef.current) {
        lastCheckedDateRef.current = currentDateString;
        setTodayDateString(currentDateString);
      }
    };

    checkDate();

    const interval = setInterval(checkDate, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!scopedCalendars || scopedCalendars.length === 0) {
      return;
    }

    const calendarsKey = getCalendarsKey(scopedCalendars);
    const calendarsChanged = lastCalendarsRef.current !== calendarsKey;

    const disabledCalendars = userPreferences?.disabled_calendars;
    const hasDisabledCalendars = Array.isArray(disabledCalendars);
    const disabledCalendarsJustLoaded =
      !hadDisabledCalendarsRef.current && hasDisabledCalendars;

    if (hasDisabledCalendars) {
      hadDisabledCalendarsRef.current = true;
    }

    const silverKeyCal = findSilverKeyCalendar(scopedCalendars);

    if (
      !initializedFromPreferencesRef.current ||
      calendarsChanged ||
      disabledCalendarsJustLoaded
    ) {
      const enabledSet = initializeEnabledCalendars(
        scopedCalendars,
        hasDisabledCalendars ? disabledCalendars : undefined,
        silverKeyCal?.id ?? null,
      );
      setEnabledCalendarIds(enabledSet);
      initializedFromPreferencesRef.current = true;
      lastCalendarsRef.current = calendarsKey;
    }
  }, [scopedCalendars, userPreferences]);

  const upcomingDateRange = useMemo(() => {
    const parsed = todayDateString
      ? dayjs(todayDateString, "ddd MMM DD YYYY")
      : null;
    const todayStart =
      parsed?.isValid() && parsed
        ? parsed.startOf("day")
        : dateNow().startOf("day");
    const nextWeek = todayStart.add(7, "day").endOf("day");
    return {
      timeMin: todayStart.toISOString(),
      timeMax: nextWeek.toISOString(),
    };
  }, [todayDateString]);

  const enabledCalendarIdsArray = useMemo(
    () => Array.from(enabledCalendarIds),
    [enabledCalendarIds],
  );

  const {
    events: upcomingEventsRaw,
    refreshEvents,
    updateEvent,
    deleteEvent,
  } = useGoogleEvents({
    calendarIds: enabledCalendarIdsArray,
    timeMin: upcomingDateRange.timeMin,
    timeMax: upcomingDateRange.timeMax,
    enabled:
      isConnected && scopedCalendars.length > 0 && enabledCalendarIds.size > 0,
  });

  const {
    allAgendaModalItems,
    refreshAllAgendaEvents,
    allAgendaEventsLoading,
    allAgendaEventsQueryEnabled,
  } = useAllAgendaEventsModalQuery({
    calendarIds: enabledCalendarIdsArray,
    enabledCalendarIds,
    calendars: scopedCalendars,
    modalOpen: allAgendaEventsModalOpen,
    isConnected,
    calendarsConfigured:
      scopedCalendars.length > 0 && enabledCalendarIds.size > 0,
    silverKeyCalendarId,
    agendaTodos,
  });

  const filteredUpcomingEvents = useMemo(
    () =>
      filterEventsByCalendars(
        upcomingEventsRaw,
        enabledCalendarIds,
        scopedCalendars,
      ),
    [upcomingEventsRaw, enabledCalendarIds, scopedCalendars],
  );

  const upcomingEvents = useMemo(
    () => filterUpcomingEvents(filteredUpcomingEvents, silverKeyCalendarId),
    [filteredUpcomingEvents, silverKeyCalendarId],
  );

  const agendaTodosInRange = useMemo(() => {
    if (!agendaTodos?.length) {
      return [];
    }
    return filterTodosInRange(
      agendaTodos,
      upcomingDateRange.timeMin,
      upcomingDateRange.timeMax,
    );
  }, [agendaTodos, upcomingDateRange.timeMin, upcomingDateRange.timeMax]);

  const agendaTodosIncompleteInRange = useMemo(
    () => agendaTodosInRange.filter((t) => !t.completed),
    [agendaTodosInRange],
  );

  const completedAgendaTodosSorted = useMemo(() => {
    if (!agendaTodos?.length) {
      return [];
    }
    return sortCompletedAgendaTodosForDisplay(
      agendaTodos.filter((t) => t.completed),
    );
  }, [agendaTodos]);

  const mergedAgendaItems = useMemo(
    () =>
      mergeUpcomingAgendaItems(upcomingEvents, agendaTodosIncompleteInRange),
    [upcomingEvents, agendaTodosIncompleteInRange],
  );

  const handleConnect = useCallback(() => {
    connectGoogleCalendar();
  }, [connectGoogleCalendar]);

  const wrapWithSectionTitle = (body: ReactNode) => (
    <Box className="mt-6 gap-3">
      {sectionTitle ? (
        <Text className="text-text-primary text-lg font-medium">
          {sectionTitle}
        </Text>
      ) : null}
      {body}
    </Box>
  );

  const shouldShowConnectionPrompt = useMemo(() => {
    if (!isConnected) {
      return true;
    }
    if (isConnected && permissions !== null) {
      if (!hasRequiredPermissions || isPartiallyEnabled) {
        return true;
      }
    }
    return false;
  }, [isConnected, permissions, hasRequiredPermissions, isPartiallyEnabled]);

  const permissionsReady = !permissionsLoading && permissions !== undefined;

  const useAgendaList = agendaTodos !== undefined;

  const showDisplayAll = useMemo(() => {
    if (!permissionsReady) {
      return false;
    }
    if (!shouldShowConnectionPrompt) {
      return true;
    }
    return Boolean(agendaTodos?.length);
  }, [permissionsReady, shouldShowConnectionPrompt, agendaTodos]);

  const openAllAgendaModal = useCallback(() => {
    setAllAgendaEventsModalOpen(true);
  }, []);

  const openCompletedTodosModal = useCallback(() => {
    setCompletedTodosModalOpen(true);
  }, []);

  const { agendaHeaderActions, eventListHeaderActions } =
    useUpcomingAgendaHeaderActions({
      showDisplayAll,
      useAgendaList,
      completedTodoCount: completedAgendaTodosSorted.length,
      headerActions,
      openAllAgendaModal,
      openCompletedTodosModal,
    });

  const agendaListProps = {
    embedInListHeader,
    border: "light" as const,
    title: AGENDA_TITLE,
    emptyMessage: "No upcoming events or to-dos in the next week",
    headerActions: agendaHeaderActions,
    silverKeyCalendarId,
    refreshEvents,
    updateEvent,
    deleteEvent,
    calendars: scopedCalendars,
    onToggleAgendaTodo,
    canEditAgendaTodos,
    onSigningAgendaPress,
  };

  const completedTodosModalEl =
    useAgendaList && completedAgendaTodosSorted.length > 0 ? (
      <CompletedAgendaTodosModal
        isOpen={completedTodosModalOpen}
        onClose={() => setCompletedTodosModalOpen(false)}
        completedTodos={completedAgendaTodosSorted}
        onToggleAgendaTodo={onToggleAgendaTodo}
        canEditAgendaTodos={canEditAgendaTodos}
      />
    ) : null;

  const allAgendaEventsModalEl = showDisplayAll ? (
    <AllAgendaEventsModal
      isOpen={allAgendaEventsModalOpen}
      onClose={() => setAllAgendaEventsModalOpen(false)}
      items={allAgendaModalItems}
      loading={allAgendaEventsQueryEnabled && allAgendaEventsLoading}
      silverKeyCalendarId={silverKeyCalendarId}
      refreshEvents={refreshAllAgendaEvents}
      updateEvent={updateEvent}
      deleteEvent={deleteEvent}
      calendars={scopedCalendars}
      onToggleAgendaTodo={onToggleAgendaTodo}
      canEditAgendaTodos={canEditAgendaTodos}
      onSigningAgendaPress={onSigningAgendaPress}
    />
  ) : null;

  if (!permissionsReady) {
    const loadingCard = (
      <Card
        border="charcoal"
        className={sectionTitle ? "w-full" : "mt-4 w-full"}
        padding="sm"
        hover={false}
      >
        <Text className="text-text-secondary text-center text-sm">
          Loading calendar permissions...
        </Text>
      </Card>
    );
    return sectionTitle ? wrapWithSectionTitle(loadingCard) : loadingCard;
  }

  if (shouldShowConnectionPrompt) {
    const hasTodosWhileDisconnected =
      useAgendaList &&
      (agendaTodosIncompleteInRange.length > 0 ||
        completedAgendaTodosSorted.length > 0);

    if (suppressConnectionPrompt) {
      if (!hasTodosWhileDisconnected) {
        return null;
      }
      const todosOnly = (
        <Box className={sectionTitle ? "w-full" : "mt-4 w-full"}>
          <UpcomingAgendaList
            items={mergeUpcomingAgendaItems([], agendaTodosIncompleteInRange)}
            {...agendaListProps}
          />
          {completedTodosModalEl}
          {allAgendaEventsModalEl}
        </Box>
      );
      return sectionTitle ? wrapWithSectionTitle(todosOnly) : todosOnly;
    }

    if (!hasTodosWhileDisconnected) {
      const promptCard = (
        <Card
          border="charcoal"
          className={sectionTitle ? "w-full" : "mt-4 w-full"}
          padding="sm"
          hover={false}
        >
          <CalendarConnectionPrompt
            onConnect={handleConnect}
            isLoading={calendarsLoading}
          />
        </Card>
      );
      return sectionTitle ? wrapWithSectionTitle(promptCard) : promptCard;
    }

    const disconnectedBody = (
      <Box className={sectionTitle ? "w-full gap-4" : "mt-4 w-full gap-4"}>
        <Card border="charcoal" className="w-full" padding="sm" hover={false}>
          <CalendarConnectionPrompt
            onConnect={handleConnect}
            isLoading={calendarsLoading}
          />
        </Card>
        <UpcomingAgendaList
          items={mergeUpcomingAgendaItems([], agendaTodosIncompleteInRange)}
          {...agendaListProps}
        />
        {completedTodosModalEl}
        {allAgendaEventsModalEl}
      </Box>
    );
    return sectionTitle
      ? wrapWithSectionTitle(disconnectedBody)
      : disconnectedBody;
  }

  const list = (
    <Box className="mt-4 w-full">
      {useAgendaList ? (
        <UpcomingAgendaList items={mergedAgendaItems} {...agendaListProps} />
      ) : (
        <EventList
          events={upcomingEvents}
          title={AGENDA_TITLE}
          emptyMessage="No upcoming events, to-dos, or signatures in the next week"
          headerActions={eventListHeaderActions}
          embedInListHeader={embedInListHeader}
          border="light"
          silverKeyCalendarId={silverKeyCalendarId}
          refreshEvents={refreshEvents}
          updateEvent={updateEvent}
          deleteEvent={deleteEvent}
          calendars={scopedCalendars}
        />
      )}
      {completedTodosModalEl}
      {allAgendaEventsModalEl}
    </Box>
  );
  return sectionTitle ? wrapWithSectionTitle(list) : list;
}
