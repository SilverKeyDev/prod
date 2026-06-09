import type { ReactNode } from "react";

import type { UpdateTodoRequest } from "packages/features/agent/api/agent";
import { AllAgendaEventsModal } from "packages/features/calendar/components/view/agenda/AllAgendaEventsModal";
import { EventList } from "packages/features/calendar/components/view/agenda/EventList";
import { UpcomingAgendaList } from "packages/features/calendar/components/view/agenda/UpcomingAgendaList";
import { CalendarConnectionPrompt } from "packages/features/calendar/components/view/CalendarConnectionPrompt";
import { ClientCalendarAccessPrompt } from "packages/features/calendar/components/view/ClientCalendarAccessPrompt";
import { Box, Text } from "packages/ui/components/structure/primitives";
import Card from "packages/ui/components/surfaces/cards/Card";

import { useUpcomingEventsData } from "@/features/calendar/hooks/data/core/useUpcomingEventsData";
import type { AgendaTodoDTO } from "@/features/calendar/types/agenda";
import {
  AGENDA_TODAY_EMPTY_MESSAGE,
  mergeUpcomingAgendaItems,
} from "@/features/calendar/utils/agenda/mergeUpcomingAgenda";

import { UpcomingEventsSection } from "./UpcomingEventsSection";

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
  updateAgendaTodo?: (id: string, data: UpdateTodoRequest) => Promise<void>;
  deleteAgendaTodo?: (id: string) => Promise<void>;
  onSigningAgendaPress?: (agreementId: string) => void;
  headerActions?: ReactNode;
  /** Agent client hub: show this user's calendar in the agenda. */
  clientUserId?: string | null;
};

export function UpcomingEvents({
  embedInListHeader = false,
  suppressConnectionPrompt = false,
  sectionTitle,
  agendaTodos,
  onToggleAgendaTodo,
  canEditAgendaTodos = false,
  updateAgendaTodo,
  deleteAgendaTodo,
  onSigningAgendaPress,
  headerActions,
  clientUserId = null,
}: UpcomingEventsProps = {}) {
  const d = useUpcomingEventsData({
    embedInListHeader,
    suppressConnectionPrompt,
    agendaTodos,
    onToggleAgendaTodo,
    canEditAgendaTodos,
    updateAgendaTodo,
    deleteAgendaTodo,
    onSigningAgendaPress,
    headerActions,
    clientUserId,
  });

  const wrap = (body: ReactNode) =>
    sectionTitle ? (
      <UpcomingEventsSection sectionTitle={sectionTitle}>{body}</UpcomingEventsSection>
    ) : (
      body
    );

  const allAgendaEventsModalEl = d.showDisplayAll ? (
    <AllAgendaEventsModal
      isOpen={d.allAgendaEventsModalOpen}
      onClose={() => d.setAllAgendaEventsModalOpen(false)}
      items={d.allAgendaModalItems}
      loading={d.allAgendaEventsQueryEnabled && d.allAgendaEventsLoading}
      silverKeyCalendarId={d.silverKeyCalendarId}
      refreshEvents={d.refreshAllAgendaEvents}
      updateEvent={d.agendaListProps.updateEvent}
      deleteEvent={d.agendaListProps.deleteEvent}
      calendars={d.agendaListProps.calendars}
      onToggleAgendaTodo={d.onToggleAgendaTodo}
      canEditAgendaTodos={d.canEditAgendaTodos}
      updateAgendaTodo={d.updateAgendaTodo}
      deleteAgendaTodo={d.deleteAgendaTodo}
      onSigningAgendaPress={d.onSigningAgendaPress}
      isAgendaEventComplete={d.isAgendaEventComplete}
      onToggleAgendaEventComplete={d.onToggleAgendaEventComplete}
      completedEventKeys={d.completedEventKeys}
    />
  ) : null;

  if (d.isClientAgendaMode && d.clientAgendaLoading) {
    const loadingCard = (
      <Card
        border="charcoal"
        className={sectionTitle ? "w-full" : "mt-4 w-full"}
        padding="sm"
        hover={false}
      >
        <Text className="text-text-secondary text-center text-sm">Loading client calendar…</Text>
      </Card>
    );
    return wrap(loadingCard);
  }

  if (d.isClientAgendaMode && d.clientCalendarAccessError) {
    const hasTodosWhileBlocked =
      d.useAgendaList &&
      (d.agendaTodosIncompleteInRange.length > 0 || d.completedAgendaTodosSorted.length > 0);

    const accessBlockedBody = (
      <Box className={sectionTitle ? "w-full gap-4" : "mt-4 w-full gap-4"}>
        <Card border="charcoal" className="w-full" padding="sm" hover={false}>
          <ClientCalendarAccessPrompt
            clientHasConnection={d.clientCalendarAccessError.clientHasConnection}
          />
        </Card>
        {hasTodosWhileBlocked ? (
          <UpcomingAgendaList
            items={mergeUpcomingAgendaItems([], d.agendaTodosIncompleteInRange)}
            {...d.agendaListProps}
          />
        ) : null}
        {allAgendaEventsModalEl}
      </Box>
    );
    return wrap(accessBlockedBody);
  }

  if (d.isClientAgendaMode && d.clientAgendaErrorMessage) {
    const errorCard = (
      <Card
        border="charcoal"
        className={sectionTitle ? "w-full" : "mt-4 w-full"}
        padding="sm"
        hover={false}
      >
        <Text className="text-text-secondary text-center text-sm">
          {d.clientAgendaErrorMessage}
        </Text>
      </Card>
    );
    return wrap(errorCard);
  }

  if (!d.permissionsReady) {
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
    return wrap(loadingCard);
  }

  if (d.connectionStatusLoading) {
    return null;
  }

  if (d.shouldShowConnectionPrompt) {
    const hasTodosWhileDisconnected =
      d.useAgendaList &&
      (d.agendaTodosIncompleteInRange.length > 0 || d.completedAgendaTodosSorted.length > 0);

    if (d.suppressConnectionPrompt) {
      if (!hasTodosWhileDisconnected) {
        return null;
      }
      const todosOnly = (
        <Box className={sectionTitle ? "w-full" : "mt-4 w-full"}>
          <UpcomingAgendaList
            items={mergeUpcomingAgendaItems([], d.agendaTodosIncompleteInRange)}
            {...d.agendaListProps}
          />
          {allAgendaEventsModalEl}
        </Box>
      );
      return wrap(todosOnly);
    }

    if (!hasTodosWhileDisconnected) {
      const promptCard = (
        <Card
          border="charcoal"
          className={sectionTitle ? "w-full" : "mt-4 w-full"}
          padding="sm"
          hover={false}
        >
          <CalendarConnectionPrompt onConnect={d.handleConnect} isLoading={d.calendarsLoading} />
        </Card>
      );
      return wrap(promptCard);
    }

    const disconnectedBody = (
      <Box className={sectionTitle ? "w-full gap-4" : "mt-4 w-full gap-4"}>
        <Card border="charcoal" className="w-full" padding="sm" hover={false}>
          <CalendarConnectionPrompt onConnect={d.handleConnect} isLoading={d.calendarsLoading} />
        </Card>
        <UpcomingAgendaList
          items={mergeUpcomingAgendaItems([], d.agendaTodosIncompleteInRange)}
          {...d.agendaListProps}
        />
        {allAgendaEventsModalEl}
      </Box>
    );
    return wrap(disconnectedBody);
  }

  const list = (
    <Box className="mt-4 w-full">
      {d.useAgendaList ? (
        <UpcomingAgendaList items={d.mergedAgendaItems} {...d.agendaListProps} />
      ) : (
        <EventList
          events={d.upcomingEvents}
          title={AGENDA_TITLE}
          emptyMessage={AGENDA_TODAY_EMPTY_MESSAGE}
          headerActions={d.eventListHeaderActions}
          embedInListHeader={d.embedInListHeader}
          border="light"
          silverKeyCalendarId={d.silverKeyCalendarId}
          refreshEvents={d.agendaListProps.refreshEvents}
          updateEvent={d.agendaListProps.updateEvent}
          deleteEvent={d.agendaListProps.deleteEvent}
          calendars={d.agendaListProps.calendars}
        />
      )}
      {allAgendaEventsModalEl}
    </Box>
  );
  return wrap(list);
}
