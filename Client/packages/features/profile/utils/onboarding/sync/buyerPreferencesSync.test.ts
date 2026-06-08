import { describe, expect, it } from "vitest";

import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import {
  applyBuyerFlatFieldsFromApi,
  buildBuyerPreferenceExtensionsFromForm,
} from "packages/features/profile/utils/onboarding/sync/buyerPreferencesSync";

describe("buyerPreferencesSync", () => {
  it("builds buyer_about_me and price_financing from flat form", () => {
    const form: OnboardingData = {
      buyer_about_moving_with: ["kids", "partner"],
      buyer_about_kids_ages: "6, 9",
      buyer_about_has_pets: true,
      buyer_about_pet_types: ["dog"],
      lender_status: "not_yet",
      want_lender_connection: true,
      loan_type: "conventional",
      down_payment_band: "10_20",
      home_budget_max: 500_000,
    };
    const ext = buildBuyerPreferenceExtensionsFromForm(form);
    expect(ext?.buyer_about_me?.moving_with).toEqual(["kids", "partner"]);
    expect(ext?.price_financing?.lender_status).toBe("not_yet");
    expect(ext?.price_financing?.down_payment_band).toBe("10_20");
  });

  it("hydrates flat fields from API extensions", () => {
    const data: OnboardingData = {
      buyerPreferenceExtensions: {
        v: 1,
        buyer_about_me: { moving_with: ["just_me"], move_motivation: "Upgrade" },
        price_financing: { lender_status: "pre_approved", lender_name: "Better" },
      },
    };
    const out = applyBuyerFlatFieldsFromApi(data, { pets: "no" });
    expect(out.buyer_about_moving_with).toEqual(["just_me"]);
    expect(out.lender_status).toBe("pre_approved");
    expect(out.buyer_about_has_pets).toBe(false);
  });

  it("omits lender_name when status switches to not_yet", () => {
    const form: OnboardingData = {
      lender_status: "not_yet",
      want_lender_connection: true,
      buyerPreferenceExtensions: {
        v: 1,
        price_financing: {
          lender_status: "pre_approved",
          lender_name: "Old Lender",
          hoa_ok: true,
        },
      },
    };
    const ext = buildBuyerPreferenceExtensionsFromForm(form);
    expect(ext?.price_financing?.lender_status).toBe("not_yet");
    expect(ext?.price_financing?.lender_name).toBeUndefined();
    expect(ext?.price_financing?.want_lender_connection).toBe(true);
    expect(ext?.price_financing?.hoa_ok).toBe(true);
  });

  it("hydrates preferred_contact_method from prefs", () => {
    const data: OnboardingData = {};
    const out = applyBuyerFlatFieldsFromApi(data, { preferred_contact_method: "email" });
    expect(out.preferred_contact_method).toBe("email");
  });
});
