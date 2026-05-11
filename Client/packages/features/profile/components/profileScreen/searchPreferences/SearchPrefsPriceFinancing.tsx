import React from "react";

import type { BuyerPriceFinancing } from "packages/features/profile/types/buyerPreferenceExtensions";
import { FIELD_LABELS, PROFILE_NOT_SPECIFIED_LABEL } from "packages/features/profile/utils";
import { Input } from "packages/ui";
import { Box } from "packages/ui/components/primitives";

import AlignedRow from "@/components/layout/AlignedRow";
import Label from "@/features/profile/components/settings/inputs/Label";
import { ProfileCheckbox } from "@/features/profile/components/settings/inputs/ProfileCheckbox";
import { profileFieldValueClassName } from "@/features/profile/utils";

import type { PatchBuyerPreferenceExtensions } from "./types";
import { withBuyerExtV1 } from "./withBuyerExtV1";

type SearchPrefsPriceFinancingProps = {
  isEditMode: boolean;
  patch: PatchBuyerPreferenceExtensions;
  budgetSummary: string;
  pf: BuyerPriceFinancing;
};

export function SearchPrefsPriceFinancing({
  isEditMode,
  patch,
  budgetSummary: _budgetSummary,
  pf,
}: SearchPrefsPriceFinancingProps) {
  const hoaOk = pf.hoa_ok ?? true;

  const items = [
    {
      title: <Label>{FIELD_LABELS.HOA_OK}</Label>,
      content: (
        <ProfileCheckbox
          isEditMode={isEditMode}
          checked={hoaOk}
          label={FIELD_LABELS.HOA_OK}
          onToggle={() =>
            patch((p) => {
              const b = withBuyerExtV1(p);
              const nextOk = !(b.price_financing?.hoa_ok ?? true);
              return {
                ...b,
                price_financing: { ...b.price_financing, hoa_ok: nextOk },
              };
            })
          }
          className="self-start"
          gap="gap-3"
        />
      ),
    },
  ];

  if (hoaOk) {
    items.push({
      title: <Label>{FIELD_LABELS.HOA_FEE_MAX}</Label>,
      content: isEditMode ? (
        <Input
          type="number"
          value={pf.hoa_fee_max_monthly?.toString() ?? ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            patch((p) => {
              const b = withBuyerExtV1(p);
              const n = parseInt(raw, 10);
              return {
                ...b,
                price_financing: {
                  ...b.price_financing,
                  hoa_fee_max_monthly: Number.isNaN(n) ? undefined : n,
                },
              };
            });
          }}
          placeholder="e.g. 350 / month"
        />
      ) : (
        <Box
          className={`mobile-input bg-background-base ${profileFieldValueClassName(
            pf.hoa_fee_max_monthly
          )}`}
        >
          {pf.hoa_fee_max_monthly ?? PROFILE_NOT_SPECIFIED_LABEL}
        </Box>
      ),
    });
  }

  return <AlignedRow breakIntoRows="sm" gap="lg" justify="start" items={items} />;
}
