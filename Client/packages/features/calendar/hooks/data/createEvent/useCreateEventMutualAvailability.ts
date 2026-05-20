import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { preferencesApi } from "packages/api";
import { queryKeys } from "packages/config/query/keys";
import { toBuyerPreferenceExtensions } from "packages/features/profile/types/buyerPreferenceExtensions";
import { useUserData, useUserPreferences } from "packages/hooks/data/user/useUserData";
import { useGoogleCalendarStore } from "packages/store";
import { CREATE_EVENT_TIME_STEP_MINUTES } from "packages/utils/calendar/createEvent/eventFormGooglePayload";
import { dayjs } from "packages/utils/date";
import {
  type AvailabilityParty,
  type BuyerAvailabilityPrefs,
  isMutualUtcRangeAvailable,
  mutualDayHasAvailableSlot,
} from "packages/utils/scheduling/eventRequestAvailability";

import {
  queryAvailability,
  queryClientAvailabilityAsBlocks,
} from "@/features/calendar/api/schedulingQueries";
import type { FreebusyTimeBlock } from "@/features/calendar/types/scheduling";

const RANGE_DAYS = 90;

/**
 * Mutual scheduling: Google free/busy for each party when connected, plus
 * agent weekly profile windows from `extended_buyer_preferences.availability`.
 * Buyers do not store profile hours; when booking with an agent we load the agent's prefs.
 */
function emptyParty(): AvailabilityParty {
  return { prefs: undefined, busyBlocks: [] };
}

export type CreateEventMutualAvailability = {
  hintsReady: boolean;
  /** When false, skip mutual UI (e.g. edit mode). */
  mutualUiEnabled: boolean;
  viewerTimeZone: string;
  stepMinutes: number;
  /** Calendar days (YYYY-MM-DD) with at least one mutually free step slot. */
  mutualDayKeys: Set<string>;
  /** Label for messages: "Client" | "Your agent" | "the other participant" */
  otherPartyLabel: string;
  /** True when buyer flow: we only have the agent's profile rules, not their Google calendar. */
  buyerCannotLoadAgentGoogleBusy: boolean;
  /** Agent+client or buyer+assigned agent — mutual logic involves two parties' calendars when connected. */
  isTwoParty: boolean;
  isMutualUtcRange: (startMs: number, endMs: number) => boolean;
};

export function useCreateEventMutualAvailability({
  isOpen,
  mode,
  isAgent,
  selectedClientId,
  selectedCalendarId,
}: {
  isOpen: boolean;
  mode: "create" | "edit";
  isAgent: boolean;
  selectedClientId: string | null;
  selectedCalendarId: string;
}): CreateEventMutualAvailability {
  const isGoogleConnected = useGoogleCalendarStore((s) => s.isConnected);
  const { userProfile } = useUserData();
  const { userPreferences, preferencesLoading: selfPrefsLoading } = useUserPreferences();

  const agentIdForBuyer = userProfile?.agent_id?.trim() || null;
  const otherUserId = isAgent ? selectedClientId : agentIdForBuyer;

  const range = useMemo(() => {
    const start = dayjs().startOf("day");
    const end = start.add(RANGE_DAYS, "day");
    return { timeMin: start.toISOString(), timeMax: end.toISOString() };
  }, []);

  const calKey = selectedCalendarId?.trim() || "primary";

  const selfBusyQuery = useQuery({
    queryKey: queryKeys.scheduling.availability(range.timeMin, range.timeMax, [calKey]),
    queryFn: async () => queryAvailability(range.timeMin, range.timeMax, [calKey]),
    enabled: Boolean(isOpen && mode === "create" && isGoogleConnected),
    staleTime: 5 * 60 * 1000,
  });

  const clientBusyQuery = useQuery({
    queryKey:
      selectedClientId != null && selectedClientId !== ""
        ? queryKeys.scheduling.clientAvailability(
            selectedClientId,
            range.timeMin,
            range.timeMax,
            "primary"
          )
        : ([...queryKeys.scheduling.all, "clientAvailability", "none"] as const),
    queryFn: async () =>
      queryClientAvailabilityAsBlocks(selectedClientId!, range.timeMin, range.timeMax, ["primary"]),
    enabled: Boolean(
      isOpen && mode === "create" && isGoogleConnected && isAgent && selectedClientId
    ),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const agentPrefsQuery = useQuery({
    queryKey: queryKeys.user.preferences(agentIdForBuyer),
    queryFn: async () => {
      const response = await preferencesApi.getByUserId(agentIdForBuyer!);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch preferences");
      }
      return response.preferences ?? null;
    },
    enabled: Boolean(
      isOpen && mode === "create" && !isAgent && agentIdForBuyer && agentIdForBuyer.length > 0
    ),
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const viewerTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    []
  );

  const selfProfileSlots: BuyerAvailabilityPrefs | undefined = useMemo(() => {
    if (!isAgent) return undefined;
    return toBuyerPreferenceExtensions(userPreferences?.extended_buyer_preferences)?.availability;
  }, [isAgent, userPreferences?.extended_buyer_preferences]);

  const otherProfileSlots: BuyerAvailabilityPrefs | undefined = useMemo(() => {
    if (isAgent) return undefined;
    return toBuyerPreferenceExtensions(agentPrefsQuery.data?.extended_buyer_preferences)
      ?.availability;
  }, [isAgent, agentPrefsQuery.data?.extended_buyer_preferences]);

  const selfParty: AvailabilityParty = useMemo(
    () => ({
      prefs: selfProfileSlots,
      busyBlocks: (selfBusyQuery.data ?? []) as FreebusyTimeBlock[],
    }),
    [selfProfileSlots, selfBusyQuery.data]
  );

  const otherParty: AvailabilityParty = useMemo(() => {
    if (!otherUserId) {
      return emptyParty();
    }
    const busy: FreebusyTimeBlock[] =
      isAgent && selectedClientId ? ((clientBusyQuery.data ?? []) as FreebusyTimeBlock[]) : [];
    return {
      prefs: otherProfileSlots,
      busyBlocks: busy,
    };
  }, [otherUserId, isAgent, selectedClientId, clientBusyQuery.data, otherProfileSlots]);

  const mutualTwoParty = Boolean(otherUserId);

  const isTwoParty = mutualTwoParty;

  const hintsReady =
    (!isAgent || !selfPrefsLoading) &&
    (!otherUserId || isAgent || !agentPrefsQuery.isLoading) &&
    (!isGoogleConnected || !selfBusyQuery.isLoading) &&
    (!isAgent || !selectedClientId || !isGoogleConnected || !clientBusyQuery.isLoading);

  const mutualDayKeys = useMemo(() => {
    const set = new Set<string>();
    if (!hintsReady || mode !== "create") {
      return set;
    }
    const a = selfParty;
    const b = mutualTwoParty ? otherParty : emptyParty();
    const start = dayjs().startOf("day");
    for (let d = 0; d < RANGE_DAYS; d += 1) {
      const ymd = start.add(d, "day").format("YYYY-MM-DD");
      if (
        mutualDayHasAvailableSlot({
          ymd,
          stepMinutes: CREATE_EVENT_TIME_STEP_MINUTES,
          viewerTimeZone,
          a,
          b,
        })
      ) {
        set.add(ymd);
      }
    }
    return set;
  }, [hintsReady, mode, mutualTwoParty, otherParty, selfParty, viewerTimeZone]);

  const isMutualUtcRange = useMemo(() => {
    const a = selfParty;
    const b = mutualTwoParty ? otherParty : emptyParty();
    return (startMs: number, endMs: number) => isMutualUtcRangeAvailable(startMs, endMs, a, b);
  }, [mutualTwoParty, otherParty, selfParty]);

  const otherPartyLabel = !isAgent ? "Your agent" : "Client";

  const buyerCannotLoadAgentGoogleBusy = Boolean(!isAgent && agentIdForBuyer);

  const mutualUiEnabled = mode === "create";

  return {
    hintsReady,
    mutualUiEnabled,
    viewerTimeZone,
    stepMinutes: CREATE_EVENT_TIME_STEP_MINUTES,
    mutualDayKeys,
    otherPartyLabel,
    buyerCannotLoadAgentGoogleBusy,
    isTwoParty,
    isMutualUtcRange,
  };
}
