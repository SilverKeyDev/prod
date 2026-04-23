import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { preferencesApi } from "packages/api";
import { queryKeys } from "packages/config/query/keys";
import { toBuyerPreferenceExtensions } from "packages/features/profile/types/buyerPreferenceExtensions";
import { useUserData, useUserPreferences } from "packages/hooks/data/user/useUserData";
import { useAuthStore, useGoogleCalendarStore } from "packages/store";
import { dayjs } from "packages/utils/date";
import {
  type AvailabilityParty,
  hasConfiguredBuyerAvailabilitySlots,
  isMutualUtcRangeAvailable,
  mutualDayHasAvailableSlot,
} from "packages/utils/scheduling/eventRequestAvailability";

import {
  queryAvailability,
  queryClientAvailabilityAsBlocks,
} from "@/features/calendar/api/schedulingQueries";
import type { FreebusyTimeBlock } from "@/features/calendar/types/scheduling";
import { CREATE_EVENT_TIME_STEP_MINUTES } from "@/features/calendar/utils/parsing/eventFormGooglePayload";

const RANGE_DAYS = 90;

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
  /** True when the other participant has no weekly/one-off availability configured. */
  otherPartyHasNoAvailabilityPrefs: boolean;
  /** Label for messages: "Client" | "Your agent" | "the other participant" */
  otherPartyLabel: string;
  /** True when buyer flow: we only have the agent's profile rules, not their Google calendar. */
  buyerCannotLoadAgentGoogleBusy: boolean;
  /** Agent+client or buyer+assigned agent — mutual logic involves two profiles. */
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
  const authReady = useAuthStore((s) => s.authReady);
  const isGoogleConnected = useGoogleCalendarStore((s) => s.isConnected);
  const { userProfile } = useUserData();
  const agentIdForBuyer = userProfile?.agent_id?.trim() || null;

  const { userPreferences: selfPrefs, preferencesLoading: selfPrefsLoading } = useUserPreferences();

  const otherUserId = isAgent ? selectedClientId : agentIdForBuyer;

  const otherPrefsQuery = useQuery({
    queryKey: otherUserId
      ? queryKeys.user.preferences(otherUserId)
      : ([...queryKeys.user.all, "preferences", "mutualOther", "none"] as const),
    queryFn: async () => {
      const response = await preferencesApi.getByUserId(otherUserId!);
      if (!response.success) {
        throw new Error(
          typeof response.error === "string" ? response.error : "Failed to load preferences"
        );
      }
      return response.preferences ?? null;
    },
    enabled: Boolean(authReady && isOpen && mode === "create" && otherUserId),
    staleTime: 5 * 60 * 1000,
  });

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

  const viewerTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    []
  );

  const selfAvail = useMemo(
    () => toBuyerPreferenceExtensions(selfPrefs?.extended_buyer_preferences)?.availability,
    [selfPrefs?.extended_buyer_preferences]
  );

  const otherAvail = useMemo(
    () =>
      toBuyerPreferenceExtensions(otherPrefsQuery.data?.extended_buyer_preferences)?.availability,
    [otherPrefsQuery.data?.extended_buyer_preferences]
  );

  const selfParty: AvailabilityParty = useMemo(
    () => ({
      prefs: selfAvail,
      busyBlocks: (selfBusyQuery.data ?? []) as FreebusyTimeBlock[],
    }),
    [selfAvail, selfBusyQuery.data]
  );

  const otherParty: AvailabilityParty = useMemo(() => {
    if (!otherUserId) {
      return emptyParty();
    }
    const busy: FreebusyTimeBlock[] =
      isAgent && selectedClientId ? ((clientBusyQuery.data ?? []) as FreebusyTimeBlock[]) : [];
    return {
      prefs: otherAvail,
      busyBlocks: busy,
    };
  }, [otherUserId, otherAvail, isAgent, selectedClientId, clientBusyQuery.data]);

  const mutualTwoParty = Boolean(otherUserId);

  const isTwoParty = mutualTwoParty;

  const hintsReady =
    !selfPrefsLoading &&
    (!otherUserId || !otherPrefsQuery.isLoading) &&
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

  const otherPartyHasNoAvailabilityPrefs =
    Boolean(otherUserId) &&
    otherPrefsQuery.isSuccess &&
    !hasConfiguredBuyerAvailabilitySlots(otherAvail);

  const otherPartyLabel = !isAgent ? "Your agent" : "Client";

  const buyerCannotLoadAgentGoogleBusy = Boolean(!isAgent && agentIdForBuyer);

  const mutualUiEnabled = mode === "create";

  return {
    hintsReady,
    mutualUiEnabled,
    viewerTimeZone,
    stepMinutes: CREATE_EVENT_TIME_STEP_MINUTES,
    mutualDayKeys,
    otherPartyHasNoAvailabilityPrefs,
    otherPartyLabel,
    buyerCannotLoadAgentGoogleBusy,
    isTwoParty,
    isMutualUtcRange,
  };
}
