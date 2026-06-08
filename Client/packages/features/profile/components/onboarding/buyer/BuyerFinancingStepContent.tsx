import React from "react";

import { useLocalization } from "packages/contexts";
import { HomePriceEstimate } from "packages/features/homeauth/components/flows/HomePriceEstimate";
import type { DownPaymentBandValue } from "packages/features/profile/types/buyerFinancing";
import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { downPaymentDollarsFromBand } from "packages/features/profile/utils/financials/downPaymentBand";
import { Input } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";
import type { HomePriceResult } from "packages/utils/transaction/affordability";

import {
  BUYER_CREDIT_OPTIONS,
  DOWN_PAYMENT_BAND_OPTIONS,
  FIRST_HOME_OPTIONS,
  LENDER_STATUS_OPTIONS,
  LOAN_TYPE_OPTIONS,
  MOVE_TIMELINE_OPTIONS,
  NEED_TO_SELL_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  RENT_OR_OWN_OPTIONS,
  WANT_LENDER_CONNECTION_OPTIONS,
} from "./buyerOnboardingOptions";
import { BuyerFieldBlock, BuyerRadioGroup } from "./BuyerPreferenceFieldGroup";

export type BuyerFinancingStepContentProps = {
  formData: OnboardingData;
  updateField: (field: keyof OnboardingData | string, value: unknown) => void;
  isEditMode?: boolean;
  showHeader?: boolean;
  /** Affordability estimate (onboarding financial step). */
  homePriceLoading?: boolean;
  homePriceError?: string | null;
  homePriceResult?: HomePriceResult | null;
  isAffordabilityCollapsed?: boolean;
  setIsAffordabilityCollapsed?: (collapsed: boolean) => void;
  resolvedZipCode?: string;
  showAffordabilityZipHint?: boolean;
};

function parseCurrencyInput(raw: string): number | undefined {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) ? n : undefined;
}

function formatCurrencyDisplay(value: number | undefined): string {
  if (value == null || value === 0) return "";
  return value.toLocaleString("en-US");
}

export function BuyerFinancingStepContent({
  formData,
  updateField,
  isEditMode = true,
  showHeader = true,
  homePriceLoading = false,
  homePriceError = null,
  homePriceResult = null,
  isAffordabilityCollapsed = false,
  setIsAffordabilityCollapsed,
  resolvedZipCode,
  showAffordabilityZipHint = false,
}: BuyerFinancingStepContentProps) {
  const { t } = useLocalization();
  const disabled = !isEditMode;

  const lenderStatus = formData.lender_status;
  const showLenderName = lenderStatus === "pre_approved" || lenderStatus === "pre_qualified";
  const showLenderConnect = lenderStatus === "not_yet";

  const payingCash = !!formData.paying_cash;
  const paymentMethod = payingCash
    ? "cash"
    : formData.paying_cash === false
      ? "financing"
      : undefined;

  const setPaymentMethod = (value: string) => {
    const cash = value === "cash";
    updateField("paying_cash", cash);
  };

  const setDownPaymentBand = (band: string) => {
    updateField("down_payment_band", band);
    const maxBudget = formData.home_budget_max;
    if (maxBudget && maxBudget > 0) {
      const dollars = downPaymentDollarsFromBand(band as DownPaymentBandValue, maxBudget);
      updateField("down_payment", dollars);
    }
  };

  const syncDownPaymentFromBudget = (maxBudget: number | undefined) => {
    if (formData.down_payment_band && maxBudget && maxBudget > 0) {
      const dollars = downPaymentDollarsFromBand(
        formData.down_payment_band as DownPaymentBandValue,
        maxBudget
      );
      updateField("down_payment", dollars);
    }
  };

  const showSellFirst = formData.rent_or_own === "own";

  return (
    <Box className="flex flex-col gap-8">
      {showHeader && (
        <Box className="gap-2">
          <Title as="h2" size="lg">
            {t("profile.onboarding.financing.title")}
          </Title>
          <BodyText size="sm" muted>
            {t("profile.onboarding.financing.subtitle")}
          </BodyText>
        </Box>
      )}

      <BuyerFieldBlock label={t("profile.onboarding.financing.lender_status.label")}>
        <BuyerRadioGroup
          name="lender-status"
          options={[...LENDER_STATUS_OPTIONS]}
          value={lenderStatus}
          disabled={disabled}
          onChange={(v) => {
            updateField("lender_status", v);
            if (v === "not_yet") {
              updateField("lender_name", "");
            } else {
              updateField("want_lender_connection", undefined);
            }
          }}
        />
      </BuyerFieldBlock>

      {showLenderName && (
        <BuyerFieldBlock label={t("profile.onboarding.financing.lender_name.label")}>
          <Input
            value={formData.lender_name ?? ""}
            onValueChange={(text) => updateField("lender_name", text)}
            placeholder={t("profile.onboarding.financing.lender_name.placeholder")}
            editable={!disabled}
          />
        </BuyerFieldBlock>
      )}

      {showLenderConnect && (
        <BuyerFieldBlock label={t("profile.onboarding.financing.want_lender_connection.label")}>
          <BuyerRadioGroup
            name="want-lender-connection"
            options={[...WANT_LENDER_CONNECTION_OPTIONS]}
            value={
              formData.want_lender_connection === true
                ? "yes"
                : formData.want_lender_connection === false
                  ? "no"
                  : undefined
            }
            disabled={disabled}
            onChange={(v) => updateField("want_lender_connection", v === "yes")}
          />
        </BuyerFieldBlock>
      )}

      <BuyerFieldBlock label={t("profile.onboarding.financing.payment_method.label")}>
        <BuyerRadioGroup
          name="payment-method"
          options={[...PAYMENT_METHOD_OPTIONS]}
          value={paymentMethod}
          disabled={disabled}
          onChange={setPaymentMethod}
        />
      </BuyerFieldBlock>

      {!payingCash && (
        <>
          <BuyerFieldBlock label={t("profile.onboarding.financing.gross_income.label")}>
            <Input
              value={formatCurrencyDisplay(formData.gross_income)}
              onValueChange={(text) => updateField("gross_income", parseCurrencyInput(text))}
              placeholder={t("profile.onboarding.financing.gross_income.placeholder")}
              type="tel"
              editable={!disabled}
            />
          </BuyerFieldBlock>

          <BuyerFieldBlock label={t("profile.onboarding.financing.loan_type.label")}>
            <BuyerRadioGroup
              name="loan-type"
              options={[...LOAN_TYPE_OPTIONS]}
              value={formData.loan_type}
              disabled={disabled}
              onChange={(v) => updateField("loan_type", v)}
            />
          </BuyerFieldBlock>

          <BuyerFieldBlock label={t("profile.onboarding.financing.down_payment_band.label")}>
            <BuyerRadioGroup
              name="down-payment-band"
              options={[...DOWN_PAYMENT_BAND_OPTIONS]}
              value={formData.down_payment_band}
              disabled={disabled}
              onChange={setDownPaymentBand}
            />
          </BuyerFieldBlock>

          <BuyerFieldBlock label={t("profile.onboarding.financing.first_home.label")}>
            <BuyerRadioGroup
              name="first-home"
              options={[...FIRST_HOME_OPTIONS]}
              value={formData.first_home}
              disabled={disabled}
              onChange={(v) => updateField("first_home", v)}
            />
          </BuyerFieldBlock>

          <BuyerFieldBlock label={t("profile.onboarding.financing.price_range.label")}>
            <Box className="flex flex-row gap-3">
              <Box className="flex-1">
                <Input
                  value={formatCurrencyDisplay(formData.home_budget_min)}
                  onValueChange={(text) => {
                    const min = parseCurrencyInput(text);
                    updateField("home_budget_min", min);
                  }}
                  placeholder={t("profile.onboarding.financing.price_range.min_placeholder")}
                  type="tel"
                  editable={!disabled}
                />
              </Box>
              <Box className="flex-1">
                <Input
                  value={formatCurrencyDisplay(formData.home_budget_max)}
                  onValueChange={(text) => {
                    const max = parseCurrencyInput(text);
                    updateField("home_budget_max", max);
                    syncDownPaymentFromBudget(max);
                  }}
                  placeholder={t("profile.onboarding.financing.price_range.max_placeholder")}
                  type="tel"
                  editable={!disabled}
                />
              </Box>
            </Box>
          </BuyerFieldBlock>

          <BuyerFieldBlock label={t("profile.onboarding.financing.max_monthly.label")}>
            <Input
              value={formatCurrencyDisplay(formData.max_monthly_payment)}
              onValueChange={(text) => updateField("max_monthly_payment", parseCurrencyInput(text))}
              placeholder={t("profile.onboarding.financing.max_monthly.placeholder")}
              type="tel"
              editable={!disabled}
            />
          </BuyerFieldBlock>

          <BuyerFieldBlock label={t("profile.onboarding.financing.credit.label")}>
            <BuyerRadioGroup
              name="credit-score"
              options={[...BUYER_CREDIT_OPTIONS]}
              value={formData.credit_score_range}
              disabled={disabled}
              onChange={(v) => updateField("credit_score_range", v)}
            />
          </BuyerFieldBlock>

          <BuyerFieldBlock label={t("profile.onboarding.financing.rent_or_own.label")}>
            <BuyerRadioGroup
              name="rent-or-own"
              options={[...RENT_OR_OWN_OPTIONS]}
              value={formData.rent_or_own}
              disabled={disabled}
              onChange={(v) => {
                updateField("rent_or_own", v);
                if (v !== "own") {
                  updateField("need_to_sell_first", undefined);
                }
              }}
            />
          </BuyerFieldBlock>

          {showSellFirst && (
            <BuyerFieldBlock label={t("profile.onboarding.financing.need_to_sell.label")}>
              <BuyerRadioGroup
                name="need-to-sell"
                options={[...NEED_TO_SELL_OPTIONS]}
                value={formData.need_to_sell_first}
                disabled={disabled}
                onChange={(v) => updateField("need_to_sell_first", v)}
              />
            </BuyerFieldBlock>
          )}

          {showAffordabilityZipHint && (
            <BodyText size="sm" muted>
              {t("profile.onboarding.financing.affordability_zip_hint")}
            </BodyText>
          )}

          {setIsAffordabilityCollapsed && (
            <HomePriceEstimate
              homePriceLoading={homePriceLoading}
              homePriceError={homePriceError}
              homePriceResult={homePriceResult}
              isAffordabilityCollapsed={isAffordabilityCollapsed}
              setIsAffordabilityCollapsed={setIsAffordabilityCollapsed}
              idealZipCode={resolvedZipCode}
            />
          )}
        </>
      )}

      <BuyerFieldBlock label={t("profile.onboarding.financing.move_timeline.label")}>
        <BuyerRadioGroup
          name="move-timeline"
          options={[...MOVE_TIMELINE_OPTIONS]}
          value={formData.move_timeline}
          disabled={disabled}
          onChange={(v) => updateField("move_timeline", v)}
        />
      </BuyerFieldBlock>
    </Box>
  );
}
