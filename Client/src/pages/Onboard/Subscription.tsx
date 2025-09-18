import {
  Check,
  CheckCircle,
  AlertCircle,
  Zap,
  Crown,
  Building,
  Clock,
  Settings,
} from "lucide-react";
import { useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";

import KeyTurnLoader from "../../components/ui/loading/KeyTurnLoader";
import {
  useStripePayment,
  useStripePortal,
} from "../../core/hooks/data/useStripePayment";
import { useUIStore } from "../../core/store";

type Plan = {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year" | "one-time";
  features: string[];
  reportsLimit: number;
  popular?: boolean;
};

const plans: Plan[] = [
  {
    id: "unlimited-monthly",
    name: "Enterprise Monthly",
    price: 7.99,
    interval: "month",
    reportsLimit: -1,
    features: [
      "Priority support",
      "Cancel anytime",
      "Access to client insights",
    ],
  },
  {
    id: "unlimited-yearly",
    name: "Enterprise Yearly",
    price: 79.99,
    interval: "year",
    reportsLimit: -1,
    popular: true,
    features: [
      "Save 17% vs monthly",
      "Priority support",
      "Cancel anytime",
      "Access to client insights",
    ],
  },
];

export default function Subscription() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const notificationMessage =
    location.state &&
    typeof location.state === "object" &&
    "message" in location.state
      ? (location.state as { message: string }).message
      : undefined;
  const cancelled = searchParams.get("cancelled") === "true";
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  // Use billing data from Stripe payment hook
  const {
    billingInfo,
    billingLoading: isLoading,
    billingError,
    refreshBillingInfo,
  } = useStripePayment();

  // Refresh data when page loads to ensure latest updates
  useEffect(() => {
    void refreshBillingInfo();
  }, [refreshBillingInfo]);

  // Global toasts via UI store
  useEffect(() => {
    if (cancelled) {
      enqueueToast({
        type: "error",
        message:
          "Your payment was cancelled. No charges have been made to your account.",
      });
    }
    if (notificationMessage) {
      enqueueToast({ type: "info", message: notificationMessage });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelled, notificationMessage]);

  const { handleSubscription, loading: subscriptionLoading } =
    useStripePayment();
  const { handlePortal, loading: portalLoading } = useStripePortal();

  // Data is already preloaded by context - no need to fetch

  // Show only unlimited plans since tab functionality is removed
  const filteredPlans = plans.filter(
    (plan) => plan.interval === "month" || plan.interval === "year"
  );

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case "pro":
        return <Zap className="h-6 w-6" />;
      case "enterprise":
        return <Crown className="h-6 w-6" />;
      default:
        return <Building className="h-6 w-6" />;
    }
  };

  return (
    <div className="w-full px-0">
      {/* Notification from redirect */}
      {notificationMessage && (
        <div className="mb-6 border-l-4 border-yellow-400 bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle
                className="mobile-icon-sm text-yellow-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <p className="text-responsive-sm text-yellow-700">
                {notificationMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Global toasts are rendered by ToastsPortal */}

      {/* Billing & Usage Summary */}
      <div className="card mb-8 space-y-4">
        {/* Mobile Layout */}
        <div className="space-y-4 sm:hidden">
          <div className="grid grid-cols-1 gap-4">
            {/* Status - Mobile */}
            {billingInfo?.subscription?.cancel_at_period_end && (
                <div className="flex items-center justify-center gap-2">
                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                    Cancels at period end
                  </span>
                </div>
              )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <KeyTurnLoader message="Loading subscription plans..." />
          </div>
        ) : billingError ? (
          <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
            <div>
              <h3 className="text-responsive-sm font-medium text-red-800">
                Error loading billing information
              </h3>
              <p className="text-responsive-sm mt-1 text-red-700">
                {billingError}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-responsive-sm touch-friendly mt-2 font-medium text-red-700 hover:text-red-600"
              >
                Try again →
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Plan Details */}
            {billingInfo?.subscription?.plan_id ? (
              <div className="px-responsive-sm py-responsive-sm rounded-xl bg-green-50/30">
                {/* Mobile Layout */}
                <div className="space-y-3 sm:hidden">
                  {/* Status and Price Row */}
                  <div className="flex items-center justify-between">
                    {billingInfo?.subscription?.status === "active" ? (
                      <span className="text-responsive-xs gap-responsive-xs flex items-center rounded-2xl bg-green-100 px-2 py-1 font-medium text-green-800">
                        <CheckCircle className="mobile-icon-xs" />
                        Active
                      </span>
                    ) : (
                      <h4 className="text-responsive-sm font-medium text-black">
                        Plan Details
                      </h4>
                    )}

                    <div className="text-responsive-lg font-bold text-black">
                      {(() => {
                        const plan = plans.find(
                          (p) => p.id === billingInfo.subscription?.plan_id
                        );
                        if (!plan) return "$0";
                        return `$${plan.price}${
                          plan.interval === "year"
                            ? "/yr"
                            : plan.interval === "month"
                              ? "/mo"
                              : ""
                        }`;
                      })()}
                    </div>
                  </div>

                  {/* Plan Info - Flex Wrap */}
                  <div className="text-responsive-xs flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5 font-medium">
                    <span className="whitespace-nowrap">
                      <span className="text-black">• Plan: </span>
                      <span className="text-gray-500">
                        {(() => {
                          const plan = plans.find(
                            (p) => p.id === billingInfo.subscription?.plan_id
                          );
                          return plan ? plan.name : "Custom Plan";
                        })()}
                      </span>
                    </span>
                    <span className="whitespace-nowrap">
                      <span className="text-black">• Billing cycle: </span>
                      <span className="text-gray-500">
                        {(() => {
                          const plan = plans.find(
                            (p) => p.id === billingInfo.subscription?.plan_id
                          );
                          if (!plan) return "One-time";
                          return plan.interval === "month"
                            ? "Monthly"
                            : plan.interval === "year"
                              ? "Yearly"
                              : "One-time";
                        })()}
                      </span>
                    </span>
                    {billingInfo.subscription.current_period_end && (
                      <span className="whitespace-nowrap">
                        <span className="text-black">
                          • Next billing date:{" "}
                        </span>
                        <span className="text-gray-500">
                          {new Date(
                            billingInfo.subscription.current_period_end
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Manage Button */}
                  {billingInfo?.subscription?.status === "active" && (
                    <button
                      onClick={handlePortal}
                      disabled={portalLoading}
                      className="text-responsive-sm gap-responsive-xs touch-friendly flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 px-2 py-1 font-medium text-gray-700 transition-all duration-200 hover:bg-gray-200 hover:shadow-sm disabled:opacity-50"
                    >
                      <Settings className="mobile-icon-sm" />
                      {portalLoading ? "Loading..." : "Manage Subscription"}
                    </button>
                  )}
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:block">
                  <div className="mb-3 flex items-center justify-between">
                    {billingInfo?.subscription?.status === "active" ? (
                      <span className="text-responsive-sm gap-responsive-xs flex items-center rounded-2xl bg-green-100 px-2 py-1 font-medium text-green-800">
                        <CheckCircle className="mobile-icon-sm" />
                        Active
                      </span>
                    ) : (
                      <h4 className="text-responsive-md font-medium text-black">
                        Plan Details
                      </h4>
                    )}

                    <div className="gap-responsive-sm flex items-center">
                      <div className="text-responsive-xl font-bold text-black">
                        {(() => {
                          const plan = plans.find(
                            (p) => p.id === billingInfo.subscription?.plan_id
                          );
                          if (!plan) return "$0";
                          return `$${plan.price}${
                            plan.interval === "year"
                              ? "/yr"
                              : plan.interval === "month"
                                ? "/mo"
                                : ""
                          }`;
                        })()}
                      </div>

                      {billingInfo?.subscription?.status === "active" && (
                        <button
                          onClick={handlePortal}
                          disabled={portalLoading}
                          className="text-responsive-sm gap-responsive-xs flex items-center rounded-2xl border border-gray-200 bg-gray-100 px-2 py-1 font-medium text-gray-700 transition-all duration-200 hover:bg-gray-200 hover:shadow-sm disabled:opacity-50"
                        >
                          <Settings className="mobile-icon-sm" />
                          {portalLoading ? "Loading..." : "Manage"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-responsive-sm flex flex-wrap items-center justify-between gap-y-1 font-medium">
                    <span className="whitespace-nowrap">
                      <span className="text-black">• Plan: </span>
                      <span className="text-gray-500">
                        {(() => {
                          const plan = plans.find(
                            (p) => p.id === billingInfo.subscription?.plan_id
                          );
                          return plan ? plan.name : "Custom Plan";
                        })()}
                      </span>
                    </span>
                    <span className="whitespace-nowrap">
                      <span className="text-black">• Billing cycle: </span>
                      <span className="text-gray-500">
                        {(() => {
                          const plan = plans.find(
                            (p) => p.id === billingInfo.subscription?.plan_id
                          );
                          if (!plan) return "One-time";
                          return plan.interval === "month"
                            ? "Monthly"
                            : plan.interval === "year"
                              ? "Yearly"
                              : "One-time";
                        })()}
                      </span>
                    </span>
                    {billingInfo.subscription.current_period_end && (
                      <span className="whitespace-nowrap">
                        <span className="text-black">
                          • Next billing date:{" "}
                        </span>
                        <span className="text-gray-500">
                          {new Date(
                            billingInfo.subscription.current_period_end
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-responsive-sm py-responsive-md flex flex-col items-center justify-center rounded-xl bg-green-50/30 text-center">
                <Clock className="mobile-icon-xl mb-responsive-sm text-black/40" />
                <h3 className="text-responsive-md mb-responsive-xs font-medium text-black">
                  No active subscription
                </h3>
                <p className="text-responsive-sm text-black/60">
                  Get started with one of our plans below
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Plans */}
      <div
        id="plans"
        className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2"
      >
        {filteredPlans.map((plan) => {
          const displayPrice = plan.price;

          return (
            <div
              key={plan.id}
              className={`card relative mx-auto flex w-full max-w-sm flex-col transition-all duration-200 hover:shadow-lg ${plan.popular ? "shadow-lg ring-2 ring-gold" : ""} `}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
                  <span className="px-responsive-xs sm:px-responsive-sm py-responsive-xs text-responsive-xs sm:text-responsive-sm rounded-full bg-gold font-medium text-black">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="space-y-4 text-center">
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
                    plan.popular
                      ? "bg-gold text-black"
                      : "bg-black/10 text-black"
                  }`}
                >
                  <div className="h-6 w-6">{getPlanIcon(plan.id)}</div>
                </div>

                <h3 className="text-lg font-medium text-black">{plan.name}</h3>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-bold text-black">
                      ${displayPrice.toFixed(2)}
                    </span>
                    <span className="text-sm text-black/60">
                      {plan.interval === "year"
                        ? "/year"
                        : plan.interval === "month"
                          ? "/month"
                          : ""}
                    </span>
                  </div>
                  {plan.interval === "year" && (
                    <div className="text-xs font-medium text-green-600">
                      Save 17% vs monthly
                    </div>
                  )}
                </div>
              </div>

              <ul className="my-6 flex-grow space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                    <span className="text-sm text-black/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscription(plan.id)}
                disabled={
                  subscriptionLoading ??
                  billingInfo?.subscription?.plan_id === plan.id
                }
                className={`flex h-12 w-full items-center justify-center rounded-lg py-3 text-sm font-medium transition-all ${
                  billingInfo?.subscription?.plan_id === plan.id
                    ? "cursor-not-allowed border border-gray-300 bg-gray-100 text-gray-500"
                    : plan.popular
                      ? "border border-transparent bg-olive text-white hover:bg-olive-light hover:font-bold hover:text-white"
                      : "border border-olive-light bg-olive-light text-white hover:bg-olive hover:text-white"
                } ${subscriptionLoading ? "opacity-75" : ""}`}
              >
                {billingInfo?.subscription?.plan_id === plan.id ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Current Plan
                  </>
                ) : subscriptionLoading ? (
                  <>
                    <div className="mr-2">
                      <KeyTurnLoader message="" />
                    </div>
                    Processing...
                  </>
                ) : (
                  `Purchase ${plan.name}`
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
