import { describe, expect, it } from "vitest";

import { agreementAgendaAccentBarClass } from "./agreementAgendaAccentBar";

describe("agreementAgendaAccentBarClass", () => {
  it("maps your turn to sign to gold", () => {
    expect(agreementAgendaAccentBarClass("sign_now")).toBe("bg-gold");
  });

  it("maps finished agreements to light olive", () => {
    expect(agreementAgendaAccentBarClass("completed")).toBe("bg-olive-muted");
    expect(agreementAgendaAccentBarClass("signed")).toBe("bg-olive-muted");
  });

  it("maps waiting and pipeline states to gray", () => {
    expect(agreementAgendaAccentBarClass("waiting_for_signature")).toBe("bg-gray-300");
    expect(agreementAgendaAccentBarClass("waiting_for_review")).toBe("bg-gray-300");
    expect(agreementAgendaAccentBarClass("draft")).toBe("bg-gray-300");
    expect(agreementAgendaAccentBarClass("sent")).toBe("bg-gray-300");
  });

  it("maps destructive states to red", () => {
    expect(agreementAgendaAccentBarClass("voided")).toBe("bg-red-500");
    expect(agreementAgendaAccentBarClass("declined")).toBe("bg-red-500");
  });
});
