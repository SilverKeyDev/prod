import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
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
import KeyTurnLoader from "../../components/ui/loading/KeyTurnLoader";
import {
  useStripePayment,
  useStripePortal,
} from "../../hooks/useStripePayment";
import ErrorToast from "../../components/feedback/ErrorToast";
import SuccessToast from "../../components/feedback/SuccessToast";
import { useBilling } from "../../context";

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: "month" | "year" | "one-time";
  features: string[];
  reportsLimit: number;
  popular?: boolean;
}

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
  const notificationMessage = location.state?.message;
  const cancelled = searchParams.get("cancelled") === "true";
  const [showSuccess, setShowSuccess] = useState(false);
  const [toastMessage] = useState("");

  // Use preloaded data from context
  const {
    billingInfo,
    loading: isLoading,
    error: billingError,
    refreshBillingInfo,
  } = useBilling();

  // Refresh data when page loads to ensure latest updates
  useEffect(() => {
    refreshBillingInfo();
  }, [refreshBillingInfo]);

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
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
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

      {/* Cancellation Toast */}
      {cancelled && (
        <ErrorToast
          message="Your payment was cancelled. No charges have been made to your account."
          onClose={() => {}}
          duration={5000}
        />
      )}

      {/* Success Toast */}
      {showSuccess && (
        <SuccessToast
          message={toastMessage}
          onClose={() => setShowSuccess(false)}
          duration={3000}
        />
      )}

      {/* Billing & Usage Summary */}
      <div className="card space-y-4 mb-8">
        {/* Mobile Layout */}
        <div className="sm:hidden space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Status - Mobile */}
            {billingInfo?.subscription &&
              billingInfo.subscription.cancel_at_period_end && (
                <div className="flex items-center justify-center gap-2">
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                    Cancels at period end
                  </span>
                </div>
              )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <KeyTurnLoader message="Loading subscription plans..." />
          </div>
        ) : billingError ? (
          <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-responsive-sm font-medium text-red-800">
                Error loading billing information
              </h3>
              <p className="text-responsive-sm text-red-700 mt-1">
                {billingError}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-responsive-sm font-medium text-red-700 hover:text-red-600 touch-friendly"
              >
                Try again →
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Plan Details */}
            {billingInfo?.subscription?.plan_id ? (
              <div className="bg-green-50/30 px-responsive-sm py-responsive-sm rounded-xl">
                {/* Mobile Layout */}
                <div className="sm:hidden space-y-3">
                  {/* Status and Price Row */}
                  <div className="flex items-center justify-between">
                    {billingInfo?.subscription?.status === "active" ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-responsive-xs font-medium rounded-2xl flex items-center gap-responsive-xs">
                        <CheckCircle className="mobile-icon-xs" />
                        Active
                      </span>
                    ) : (
                      <h4 className="font-medium text-black text-responsive-sm">
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
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5 text-responsive-xs font-medium">
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
                      className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1 rounded-2xl text-responsive-sm font-medium transition-all duration-200 flex items-center justify-center gap-responsive-xs border border-gray-200 hover:shadow-sm disabled:opacity-50 touch-friendly"
                    >
                      <Settings className="mobile-icon-sm" />
                      {portalLoading ? "Loading..." : "Manage Subscription"}
                    </button>
                  )}
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:block">
                  <div className="flex items-center justify-between mb-3">
                    {billingInfo?.subscription?.status === "active" ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-responsive-sm font-medium rounded-2xl flex items-center gap-responsive-xs">
                        <CheckCircle className="mobile-icon-sm" />
                        Active
                      </span>
                    ) : (
                      <h4 className="font-medium text-black text-responsive-md">
                        Plan Details
                      </h4>
                    )}

                    <div className="flex items-center gap-responsive-sm">
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
                          className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1 rounded-2xl text-responsive-sm font-medium transition-all duration-200 flex items-center gap-responsive-xs border border-gray-200 hover:shadow-sm disabled:opacity-50"
                        >
                          <Settings className="mobile-icon-sm" />
                          {portalLoading ? "Loading..." : "Manage"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-y-1 text-responsive-sm font-medium">
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
              <div className="bg-green-50/30 px-responsive-sm py-responsive-md rounded-xl flex flex-col items-center justify-center text-center">
                <Clock className="mobile-icon-xl text-black/40 mb-responsive-sm" />
                <h3 className="text-responsive-md font-medium text-black mb-responsive-xs">
                  No active subscription
                </h3>
                <p className="text-black/60 text-responsive-sm">
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
        className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
      >
        {filteredPlans.map((plan) => {
          const displayPrice = plan.price;

          return (
            <div
              key={plan.id}
              className={`
                relative card transition-all duration-200 hover:shadow-lg flex flex-col max-w-sm mx-auto w-full
                ${plan.popular ? "ring-2 ring-gold shadow-lg" : ""}
              `}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gold text-black px-responsive-xs sm:px-responsive-sm py-responsive-xs rounded-full text-responsive-xs sm:text-responsive-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center space-y-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                    plan.popular
                      ? "bg-gold text-black"
                      : "bg-black/10 text-black"
                  }`}
                >
                  <div className="w-6 h-6">{getPlanIcon(plan.id)}</div>
                </div>

                <h3 className="text-lg font-medium text-black">{plan.name}</h3>

                <div className="space-y-1">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-bold text-black">
                      ${displayPrice.toFixed(2)}
                    </span>
                    <span className="text-black/60 text-sm">
                      {plan.interval === "year"
                        ? "/year"
                        : plan.interval === "month"
                        ? "/month"
                        : ""}
                    </span>
                  </div>
                  {plan.interval === "year" && (
                    <div className="text-xs text-green-600 font-medium">
                      Save 17% vs monthly
                    </div>
                  )}
                </div>
              </div>

              <ul className="space-y-3 flex-grow my-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-black/80 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscription(plan.id)}
                disabled={
                  subscriptionLoading ||
                  billingInfo?.subscription?.plan_id === plan.id
                }
                className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center h-12 text-sm ${
                  billingInfo?.subscription?.plan_id === plan.id
                    ? "bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed"
                    : plan.popular
                    ? "bg-olive text-white hover:bg-olive-light hover:text-white hover:font-bold border border-transparent"
                    : "bg-olive-light text-white hover:bg-olive hover:text-white border border-olive-light"
                } ${subscriptionLoading ? "opacity-75" : ""}`}
              >
                {billingInfo?.subscription?.plan_id === plan.id ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
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
