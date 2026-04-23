import {
  OFFER_PURCHASE_AGREEMENT_SUBMIT_ITEM_ID,
  SEARCH_BUYER_BROKER_AGREEMENT_ITEM_ID,
} from "packages/utils/calendar/buyerChecklistMilestones";

import type { CalendarEventKindId } from "./calendarEventKinds";
import { CALENDAR_EVENT_KINDS } from "./calendarEventKinds";

export type BuyerJourneyPhase =
  | "early_search"
  | "touring_pre_pa"
  | "post_pa_submit"
  /** Agent without selected client or checklist unavailable */
  | "unknown";

export type CalendarEventKindOptionSlice = {
  phase: BuyerJourneyPhase;
  allowedKindIds: CalendarEventKindId[];
  defaultKindId: CalendarEventKindId;
};

function uniqueKinds(ids: CalendarEventKindId[]): CalendarEventKindId[] {
  return [...new Set(ids)];
}

export function resolveBuyerJourneyPhase(input: {
  searchCheckedIds: number[] | undefined;
  offerCheckedIds: number[] | undefined;
}): BuyerJourneyPhase {
  const search = input.searchCheckedIds;
  const offer = input.offerCheckedIds;
  if (search == null || offer == null) {
    return "unknown";
  }
  const brokerSigned = search.includes(SEARCH_BUYER_BROKER_AGREEMENT_ITEM_ID);
  const paSubmitted = offer.includes(OFFER_PURCHASE_AGREEMENT_SUBMIT_ITEM_ID);
  if (!brokerSigned) return "early_search";
  if (!paSubmitted) return "touring_pre_pa";
  return "post_pa_submit";
}

/**
 * Allowed event kinds and default for the buyer's checklist progress.
 */
export function getCalendarEventKindOptionSlice(input: {
  searchCheckedIds: number[] | undefined;
  offerCheckedIds: number[] | undefined;
}): CalendarEventKindOptionSlice {
  const phase = resolveBuyerJourneyPhase(input);

  if (phase === "early_search") {
    return {
      phase,
      allowedKindIds: uniqueKinds([
        "agent_consultation",
        "phone_consultation",
        "meeting",
        "open_house",
        "property_viewings",
        "other",
      ]),
      defaultKindId: "agent_consultation",
    };
  }

  if (phase === "touring_pre_pa") {
    return {
      phase,
      allowedKindIds: uniqueKinds([
        "property_viewings",
        "open_house",
        "meeting",
        "agent_consultation",
        "other",
      ]),
      defaultKindId: "property_viewings",
    };
  }

  if (phase === "post_pa_submit") {
    return {
      phase,
      allowedKindIds: uniqueKinds([
        "home_inspection",
        "appraisal",
        "walkthrough",
        "closing_signing",
        "property_viewings",
        "meeting",
        "open_house",
        "other",
      ]),
      defaultKindId: "home_inspection",
    };
  }

  return {
    phase: "unknown",
    allowedKindIds: uniqueKinds([
      "agent_consultation",
      "phone_consultation",
      "meeting",
      "open_house",
      "property_viewings",
      "home_inspection",
      "appraisal",
      "walkthrough",
      "closing_signing",
      "other",
    ]),
    defaultKindId: "other",
  };
}

export function labelsForCalendarEventKindSlice(
  slice: CalendarEventKindOptionSlice
): { id: CalendarEventKindId; label: string }[] {
  return slice.allowedKindIds.map((id) => ({
    id,
    label: CALENDAR_EVENT_KINDS[id].label,
  }));
}
