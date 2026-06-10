import { describe, expect, it } from "vitest";

import { SELLER_TRANSLATIONS } from "packages/features/seller/types/translations";

import { getMessagingConfig } from "@/features/agent/components/messaging/screen/messagingConfig";

describe("getMessagingConfig seller overlay", () => {
  it("applies seller copy when clientPersona is seller", () => {
    const config = getMessagingConfig("client", { clientPersona: "seller" });
    expect(config.sidebar.title).toBe(SELLER_TRANSLATIONS.SELLER_MESSAGING_SIDEBAR_TITLE);
    expect(config.emptyStates.noAgent.title).toBe(
      SELLER_TRANSLATIONS.SELLER_MESSAGING_NO_AGENT_TITLE
    );
  });

  it("returns buyer defaults without clientPersona", () => {
    const config = getMessagingConfig("client");
    expect(config.sidebar.title).toBe("Agents");
  });
});
