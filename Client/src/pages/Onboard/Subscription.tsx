import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import {
  Check,
  Zap,
  Crown,
  Building,
  CreditCard,
  DollarSign,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
} from "lucide-react";
import {
  useStripePayment,
  useStripePortal,
} from "../../hooks/useStripePayment";
import ErrorToast from "../../components/ErrorToast";
import SuccessToast from "../../components/SuccessToast";
import { useData } from "../../contexts/DataContext";
import Loading from "../../components/Loading";
import PageHeader from "../../components/PageHeader";

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
      "Access to consumer insights",
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
      "Access to consumer insights",
    ],
  },
];

// BillingInfo type is now imported from DataContext

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
    billingLoading: isLoading,
    billingError,
    refreshBillingInfo,
  } = useData();

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
    <div className="min-h-screen bg-off-white">
      <PageHeader
        title="Subscription & Billing"
        subtitle=" Choose the perfect plan for your real estate business needs"
      />

      {/* Notification from redirect */}
      {notificationMessage && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle
                className="h-5 w-5 text-yellow-400"
                aria-hidden="true"
              />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{notificationMessage}</p>
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
      <div className="card mb-4 lg:mb-6">
        {/* Mobile Layout */}
        <div className="sm:hidden mb-3 lg:mb-4">
          <div className="grid grid-cols-1 gap-3">
            {/* Your Plan - Mobile */}
            <div className="flex flex-col items-center text-center">
              <h2 className="text-sm sm:text-base lg:text-lg font-medium text-black">
                Your Plan
              </h2>
              {billingInfo?.subscription?.plan_id && (
                <p className="text-black/60 text-sm">
                  {(() => {
                    const plan = plans.find(
                      (p) => p.id === billingInfo.subscription?.plan_id
                    );
                    return plan ? plan.name : "No active plan";
                  })()}
                </p>
              )}
            </div>

            {/* Status - Mobile */}
            {billingInfo?.subscription && (
              <div className="flex items-center justify-center space-x-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    billingInfo.subscription.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {billingInfo.subscription.status === "active" ? (
                    <span className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" /> Inactive
                    </span>
                  )}
                </span>
                {billingInfo.subscription.cancel_at_period_end && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                    Cancels at period end
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Systematic Grid Layout - Desktop (matches Plan Details and Pricing below) */}
        <div className="hidden sm:grid sm:grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4 mb-3 lg:mb-4">
          {/* Your Plan - Desktop */}
          <div className="p-4 rounded-xl flex flex-col items-center justify-center text-center">
            {billingInfo?.subscription?.plan_id ? (
              <div className="space-y-2 w-full">
                <div>
                  <p className="text-xs text-black/60">Current Plan</p>
                  <p className="font-medium text-sm">
                    {(() => {
                      const plan = plans.find(
                        (p) => p.id === billingInfo.subscription?.plan_id
                      );
                      return plan ? plan.name : "No active plan";
                    })()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-black/60 text-xs">No active plan</p>
              </div>
            )}
          </div>

          {/* Status - Desktop */}
          <div className="p-4 rounded-xl flex flex-col items-center justify-center text-center">
            {billingInfo?.subscription ? (
              <div className="space-y-2 w-full">
                <div className="flex items-center justify-center space-x-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      billingInfo.subscription.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {billingInfo.subscription.status === "active" ? (
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" /> Inactive
                      </span>
                    )}
                  </span>
                </div>
                {billingInfo.subscription.cancel_at_period_end && (
                  <div className="flex justify-center">
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                      Cancels at period end
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-black/60 text-xs">No subscription</p>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loading message="Loading billing information..." />
          </div>
        ) : billingError ? (
          <div className="bg-red-50 p-4 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Error loading billing information
              </h3>
              <p className="text-sm text-red-700 mt-1">{billingError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-600"
              >
                Try again →
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4 mb-3 lg:mb-4">
              {/* Plan Details */}
              {billingInfo?.subscription?.plan_id ? (
                <div className="bg-gradient-to-br from-navy/5 to-navy/10 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-black text-sm">
                      Plan Details
                    </h4>
                    <CreditCard className="h-5 w-5 text-black" />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-black/60">Current Plan</p>
                      <p className="font-medium text-sm">
                        {(() => {
                          const plan = plans.find(
                            (p) => p.id === billingInfo.subscription?.plan_id
                          );
                          return plan ? plan.name : "Custom Plan";
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-black/60">Billing</p>
                      <p className="font-medium text-sm">
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
                      </p>
                    </div>
                    {billingInfo.subscription.current_period_end && (
                      <div>
                        <p className="text-xs text-black/60">
                          {billingInfo.subscription.cancel_at_period_end
                            ? "Access until"
                            : "Next billing date"}
                        </p>
                        <p className="font-medium text-sm">
                          {new Date(
                            billingInfo.subscription.current_period_end
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-navy/5 to-navy/10 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <Clock className="h-8 w-8 text-black/40 mb-2" />
                  <h3 className="text-sm sm:text-base font-medium text-black mb-1">
                    No active subscription
                  </h3>
                  <p className="text-black/60 text-xs">
                    Get started with one of our plans below
                  </p>
                </div>
              )}

              {/* Price */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-black text-sm">Pricing</h4>
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                {billingInfo?.subscription?.plan_id ? (
                  <>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-black mb-1">
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
                    <p className="text-xs text-black/60 mb-3">
                      {(() => {
                        const plan = plans.find(
                          (p) => p.id === billingInfo.subscription?.plan_id
                        );
                        if (!plan) return "One-time payment";
                        return plan.interval === "year"
                          ? "Billed annually"
                          : plan.interval === "month"
                          ? "Billed monthly"
                          : "One-time payment";
                      })()}
                    </p>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-black/60 mb-4">No active plan</p>
                  </div>
                )}

                {/* Manage Subscription Button - Anchored to bottom with black text */}
                {billingInfo?.subscription?.plan_id &&
                  billingInfo?.subscription?.status === "active" && (
                    <div className="mt-auto pt-3">
                      <button
                        onClick={handlePortal}
                        disabled={portalLoading}
                        className="w-full text-black hover:text-gray-700 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center"
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        {portalLoading ? "Loading..." : "Manage Subscription"}
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Plans */}
      <div
        id="plans"
        className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4"
      >
        {filteredPlans.map((plan) => {
          const displayPrice = plan.price;

          return (
            <div
              key={plan.id}
              className={`
                relative card transition-all duration-200 hover:shadow-lg flex flex-col
                ${plan.popular ? "ring-2 ring-gold shadow-lg" : ""}
              `}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gold text-black px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 ${
                    plan.popular
                      ? "bg-gold text-black"
                      : "bg-black/10 text-black"
                  }`}
                >
                  {getPlanIcon(plan.id)}
                </div>

                <h3 className="text-base sm:text-lg font-medium text-black mb-2">
                  {plan.name}
                </h3>

                <div className="mb-3">
                  <span className="text-lg sm:text-xl lg:text-2xl font-bold text-black">
                    ${displayPrice.toFixed(2)}
                  </span>
                  <span className="text-black/60 text-sm">
                    {plan.interval === "year"
                      ? "/year"
                      : plan.interval === "month"
                      ? "/month"
                      : ""}
                  </span>
                  {plan.interval === "year" && (
                    <div className="text-xs text-green-600 font-medium">
                      Save 17% vs monthly
                    </div>
                  )}
                </div>
              </div>

              <ul className="space-y-2 mb-6 flex-grow">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-black/80 text-xs">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscription(plan.id)}
                disabled={subscriptionLoading}
                className={`w-full py-3 lg:py-3 rounded-lg font-medium transition-all flex items-center justify-center touch-friendly text-sm sm:text-base ${
                  plan.popular
                    ? "bg-olive text-white hover:bg-olive-light hover:text-white hover:font-bold border border-transparent"
                    : "bg-transparent border border-brown text-black hover:bg-brown hover:text-white"
                } ${subscriptionLoading ? "opacity-75" : ""}`}
              >
                {subscriptionLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
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
