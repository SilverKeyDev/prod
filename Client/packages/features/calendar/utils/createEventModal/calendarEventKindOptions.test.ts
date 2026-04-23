import { describe, expect, it } from "vitest";

import {
  OFFER_PURCHASE_AGREEMENT_SUBMIT_ITEM_ID,
  SEARCH_BUYER_BROKER_AGREEMENT_ITEM_ID,
} from "packages/utils/calendar/buyerChecklistMilestones";

import {
  getCalendarEventKindOptionSlice,
  resolveBuyerJourneyPhase,
} from "./calendarEventKindOptions";

describe("resolveBuyerJourneyPhase", () => {
  it("early search when buyer-broker not checked", () => {
    expect(
      resolveBuyerJourneyPhase({
        searchCheckedIds: [],
        offerCheckedIds: [],
      })
    ).toBe("early_search");
    expect(
      resolveBuyerJourneyPhase({
        searchCheckedIds: [1, 2, 3, 4, 5],
        offerCheckedIds: [],
      })
    ).toBe("early_search");
  });

  it("touring pre-PA when broker signed but PA not submitted", () => {
    expect(
      resolveBuyerJourneyPhase({
        searchCheckedIds: [SEARCH_BUYER_BROKER_AGREEMENT_ITEM_ID],
        offerCheckedIds: [],
      })
    ).toBe("touring_pre_pa");
  });

  it("post PA when offer submit item checked", () => {
    expect(
      resolveBuyerJourneyPhase({
        searchCheckedIds: [SEARCH_BUYER_BROKER_AGREEMENT_ITEM_ID],
        offerCheckedIds: [OFFER_PURCHASE_AGREEMENT_SUBMIT_ITEM_ID],
      })
    ).toBe("post_pa_submit");
  });

  it("unknown when data missing", () => {
    expect(
      resolveBuyerJourneyPhase({
        searchCheckedIds: undefined,
        offerCheckedIds: [],
      })
    ).toBe("unknown");
  });
});

describe("getCalendarEventKindOptionSlice", () => {
  it("defaults to agent consultation in early search", () => {
    const s = getCalendarEventKindOptionSlice({
      searchCheckedIds: [],
      offerCheckedIds: [],
    });
    expect(s.defaultKindId).toBe("agent_consultation");
    expect(s.allowedKindIds).toContain("other");
    expect(s.allowedKindIds).toContain("property_viewings");
  });

  it("defaults to property viewings after broker agreement", () => {
    const s = getCalendarEventKindOptionSlice({
      searchCheckedIds: [SEARCH_BUYER_BROKER_AGREEMENT_ITEM_ID],
      offerCheckedIds: [],
    });
    expect(s.defaultKindId).toBe("property_viewings");
    expect(s.allowedKindIds).toContain("property_viewings");
  });

  it("defaults to home inspection after PA submitted", () => {
    const s = getCalendarEventKindOptionSlice({
      searchCheckedIds: [SEARCH_BUYER_BROKER_AGREEMENT_ITEM_ID],
      offerCheckedIds: [OFFER_PURCHASE_AGREEMENT_SUBMIT_ITEM_ID],
    });
    expect(s.defaultKindId).toBe("home_inspection");
    expect(s.allowedKindIds).toContain("closing_signing");
  });
});
