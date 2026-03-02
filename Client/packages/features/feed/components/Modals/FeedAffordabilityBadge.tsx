import { useMemo, useState } from "react";

import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { Transition } from "packages/ui/components/adapters/headless";
import {
  AccessibleDialog,
  BodyText,
  Button,
  CloseButton,
  Title,
} from "packages/ui/components/index.web";

import type { FeedListing } from "@/features/feed/types/feed";
import {
  estimateMonthlyPayment,
  mapCreditScoreToNumber,
  type OnboardingData,
} from "@/features/profile/utils";

type FeedAffordabilityBadgeProps = {
  item: FeedListing;
};

function computeMonthlyPayment(
  item: FeedListing,
  preferences: OnboardingData | null
): number | null {
  if (!item.price || !preferences?.down_payment || !preferences?.ideal_zip_code) return null;
  const zipCode = item.zipCode ?? preferences.ideal_zip_code;
  const creditScore = mapCreditScoreToNumber(preferences.credit_score_range);
  return estimateMonthlyPayment({
    homePrice: item.price,
    downPayment: preferences.down_payment,
    zipCode,
    creditScore,
  });
}

export function FeedAffordabilityBadge({ item }: FeedAffordabilityBadgeProps) {
  const { userPreferences } = useUserPreferences();
  const [sheetOpen, setSheetOpen] = useState(false);

  const monthlyPayment = useMemo(
    () => computeMonthlyPayment(item, userPreferences ?? null),
    [item, userPreferences]
  );

  if (!monthlyPayment && !item.price) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSheetOpen(true)}
        className="rounded-lg bg-white/20 px-3 py-1.5 text-left backdrop-blur-sm transition-colors hover:bg-white/30"
        label="View monthly payment estimate"
      >
        <BodyText as="span" size="sm" className="font-medium text-white">
          {monthlyPayment
            ? `~$${monthlyPayment.toLocaleString()}/mo`
            : item.price
              ? `$${item.price.toLocaleString()}`
              : null}
        </BodyText>
      </Button>

      <Transition show={sheetOpen} as="div">
        <AccessibleDialog
          onClose={() => setSheetOpen(false)}
          className="relative z-50"
          label="Monthly payment estimate"
        >
          <Transition.Child
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className="fixed inset-0 bg-black/50"
              aria-hidden
              onClick={() => setSheetOpen(false)}
            />
          </Transition.Child>
          <div className="fixed inset-0 flex items-end justify-center p-0">
            <Transition.Child
              enter="ease-out duration-200"
              enterFrom="translate-y-full"
              enterTo="translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="translate-y-0"
              leaveTo="translate-y-full"
            >
              <AccessibleDialog.Panel className="flex max-h-[70dvh] w-full flex-col rounded-t-2xl bg-white">
                <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
                  <Title size="md" as="h2">
                    Monthly Payment Estimate
                  </Title>
                  <CloseButton onClick={() => setSheetOpen(false)} size="sm" />
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {monthlyPayment && item.price ? (
                    <div className="space-y-4">
                      <div className="bg-brand-accent/10 rounded-lg p-4">
                        <BodyText size="xs" muted className="mb-1">
                          Listing price
                        </BodyText>
                        <BodyText size="lg" className="font-semibold">
                          ${item.price.toLocaleString()}
                        </BodyText>
                      </div>
                      <div className="bg-brand-accent/10 rounded-lg p-4">
                        <BodyText size="xs" muted className="mb-1">
                          Est. monthly payment
                        </BodyText>
                        <BodyText size="lg" className="text-brand-accent font-semibold">
                          ${monthlyPayment.toLocaleString()}/mo
                        </BodyText>
                      </div>
                      <BodyText size="xs" muted>
                        Based on your saved down payment and zip code. Tap Settings to update your
                        financial profile.
                      </BodyText>
                    </div>
                  ) : (
                    <BodyText size="sm" muted>
                      Add your down payment and zip code in Settings to see estimated monthly
                      payments.
                    </BodyText>
                  )}
                </div>
              </AccessibleDialog.Panel>
            </Transition.Child>
          </div>
        </AccessibleDialog>
      </Transition>
    </>
  );
}
