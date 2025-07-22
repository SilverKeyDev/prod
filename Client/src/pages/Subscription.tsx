import { useState, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import {
  Check,
  Zap,
  Crown,
  Building,
  CreditCard,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useStripePayment } from "../hooks/useStripePayment";
import { apiRequest } from "../lib/api";
import ErrorToast from "../components/ErrorToast";
import SuccessToast from "../components/SuccessToast";

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
    id: "5-reports",
    name: "5 Reports",
    price: 4.99,
    interval: "one-time",
    reportsLimit: 5,
    features: ["No expiration"],
  },
  {
    id: "20-reports",
    name: "20 Reports",
    price: 14.99,
    interval: "one-time",
    reportsLimit: 20,
    popular: true,
    features: [
      "Save 25% vs individual reports",
    ],
  },
  {
    id: "50-reports",
    name: "50 Reports",
    price: 29.99,
    interval: "one-time",
    reportsLimit: 50,
    features: [
      "Save 40% vs individual reports",
    ],
  },
  {
    id: "unlimited-monthly",
    name: "Monthly",
    price: 9.99,
    interval: "month",
    reportsLimit: -1,
    features: [
      "Unlimited reports",
      "Advanced property analysis",
      "Priority support",
      "Cancel anytime",
    ],
  },
  {
    id: "unlimited-yearly",
    name: "Yearly",
    price: 99.99,
    interval: "year",
    reportsLimit: -1,
    popular: true,
    features: [
      "Unlimited reports",
      "Advanced property analysis",
      "Priority support",
      "Save 17% vs monthly",
      "Cancel anytime",
    ],
  },
];

interface BillingInfo {
  subscription: {
    status: string;
    plan_id: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    reports_limit: number;
    stripe_subscription_id: string | null;
  } | null;
  usage: {
    reports_available: number;
    reports_used: number;
    reports_limit: number;
  };
  has_active_subscription: boolean;
}



export default function Subscription() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const notificationMessage = location.state?.message;
  const cancelled = searchParams.get('cancelled') === 'true';
  const [activeTab, setActiveTab] = useState<"one-time" | "unlimited">("one-time");
  const [showSuccess, setShowSuccess] = useState(false);
  const [toastMessage] = useState(""); // setToastMessage was unused

  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { handleSubscription, loading: subscriptionLoading } = useStripePayment();

  useEffect(() => {
    const fetchBillingInfo = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest<BillingInfo>(
          "/api/v1/user/billing-info"
        );
        
        if (response.success && response.data) {
          setBillingInfo(response.data);
          setError(null);
        } else {
          throw new Error(response.error || 'Failed to fetch billing information');
        }
      } catch (error) {
        console.error("Failed to fetch billing info:", error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingInfo();
  }, []);

  const filteredPlans = plans.filter((plan) =>
    activeTab === "one-time"
      ? plan.interval === "one-time"
      : plan.interval === "month" || plan.interval === "year"
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-0">
      {/* Notification from redirect */}
      {notificationMessage && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
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
          onClose={() => {}} // showError state was unused
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
      
      {/* Header */}
      <div className="text-center mb-4 lg:mb-6">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-serif text-black mb-2 lg:mb-3">
          Subscription & Billing
        </h1>
        <p className="text-xs sm:text-sm lg:text-base text-black/60 max-w-2xl mx-auto">
          Choose the perfect plan for your real estate business needs
        </p>
      </div>

      {/* Billing & Usage Summary */}
      <div className="card mb-4 lg:mb-6">
        {/* Mobile Layout */}
        <div className="block sm:hidden mb-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-black">Your Plan</h2>
            {billingInfo?.subscription?.plan_id && (
              <p className="text-black/60 font-medium text-xs">
                {(() => {
                  const plan = plans.find(p => p.id === billingInfo.subscription?.plan_id);
                  return plan ? plan.name : 'No active plan';
                })()}
              </p>
            )}
          </div>
          {/* Mobile Subscription Status */}
          {billingInfo?.subscription && (
            <div className="flex items-center justify-center space-x-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                billingInfo.subscription.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {billingInfo.subscription.status === 'active' ? (
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

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between mb-3 lg:mb-4">
          <div>
            <h2 className="text-sm sm:text-base lg:text-lg font-medium text-black">Your Plan</h2>
            {billingInfo?.subscription?.plan_id && (
              <p className="text-black/60 text-sm">
                {(() => {
                  const plan = plans.find(p => p.id === billingInfo.subscription?.plan_id);
                  return plan ? plan.name : 'No active plan';
                })()}
              </p>
            )}
          </div>
          {billingInfo?.subscription && (
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                billingInfo.subscription.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {billingInfo.subscription.status === 'active' ? (
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

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading billing information</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4 mb-3 lg:mb-4">
              {/* Reports Remaining */}
              <div className="flex flex-col items-center justify-center p-3 lg:p-4">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black">
                  {billingInfo?.usage.reports_available === -1 
                    ? "∞" 
                    : Math.max(0, billingInfo?.usage.reports_available || 0)}
                </div>
                <div className="text-xs text-black/60 mt-1">
                  {billingInfo?.usage.reports_available === -1 
                    ? "Unlimited Reports" 
                    : "Reports Remaining"}
                </div>
              </div>

              {/* Plan Details */}
              {billingInfo?.subscription?.plan_id ? (
                <div className="bg-gradient-to-br from-navy/5 to-navy/10 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-black text-sm">Plan Details</h4>
                    <CreditCard className="h-5 w-5 text-black" />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-black/60">Current Plan</p>
                      <p className="font-medium text-sm">
                        {(() => {
                          const plan = plans.find(p => p.id === billingInfo.subscription?.plan_id);
                          return plan ? plan.name : 'Custom Plan';
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-black/60">Billing</p>
                      <p className="font-medium text-sm">
                        {(() => {
                          const plan = plans.find(p => p.id === billingInfo.subscription?.plan_id);
                          if (!plan) return 'One-time';
                          return plan.interval === 'month' ? 'Monthly' : 
                                 plan.interval === 'year' ? 'Yearly' : 'One-time';
                        })()}
                      </p>
                    </div>
                    {billingInfo.subscription.current_period_end && (
                      <div>
                        <p className="text-xs text-black/60">
                          {billingInfo.subscription.cancel_at_period_end 
                            ? 'Access until' 
                            : 'Next billing date'}
                        </p>
                        <p className="font-medium text-sm">
                          {new Date(billingInfo.subscription.current_period_end).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-navy/5 to-navy/10 p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <Clock className="h-8 w-8 text-black/40 mb-2" />
                  <h3 className="text-sm sm:text-base font-medium text-black mb-1">No active subscription</h3>
                  <p className="text-black/60 text-xs">
                    Get started with one of our plans below
                  </p>
                </div>
              )}

              {/* Price */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-black text-sm">Pricing</h4>
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                {billingInfo?.subscription?.plan_id ? (
                  <>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-black mb-1">
                      {(() => {
                        const plan = plans.find(p => p.id === billingInfo.subscription?.plan_id);
                        if (!plan) return '$0';
                        return `$${plan.price}${plan.interval === 'year' ? '/yr' : plan.interval === 'month' ? '/mo' : ''}`;
                      })()}
                    </div>
                    <p className="text-xs text-black/60 mb-3">
                      {(() => {
                        const plan = plans.find(p => p.id === billingInfo.subscription?.plan_id);
                        if (!plan) return 'One-time payment';
                        return plan.interval === 'year' ? 'Billed annually' : 
                               plan.interval === 'month' ? 'Billed monthly' : 'One-time payment';
                      })()}
                    </p>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-black/60 mb-4">No active plan</p>
                    <button
                      onClick={() => {
                        // Scroll to plans section
                        document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full py-2 bg-green-600 hover:bg-dark-green text-white rounded-lg font-medium transition-colors"
                    >
                      Choose a Plan
                    </button>
                  </div>
                )}
              </div>
            </div>


          </>
        )}
      </div>



      {/* Billing Toggle */}
      <div className="flex items-center justify-center mb-4">
        <div className="bg-beige/20 rounded-lg p-1 flex items-center">
          <button
            onClick={() => setActiveTab("one-time")}
            className={`px-4 py-1.5 rounded text-xs font-medium transition-all ${
              activeTab === "one-time"
                ? "bg-white text-black hover:text-black shadow-sm"
                : "text-black/60 hover:text-black"
            }`}
          >
            One-Time Purchase
          </button>
          {/*<button
            onClick={() => setActiveTab("unlimited")}
            className={`px-6 py-2 rounded text-sm font-medium transition-all ${
              activeTab === "unlimited"
                ? "bg-white text-black shadow-sm"
                : "text-black/60 hover:text-black"
            }`}
          >
            Unlimited Subscription
          </button>*/}
        </div>
      </div>

      {/* Plans */}
      <div id="plans" className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
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
                    plan.popular ? "bg-gold text-black" : "bg-black/10 text-black"
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
                  plan.popular ? "bg-olive text-white hover:bg-dark-green hover:text-white hover:font-bold border border-transparent" : "bg-transparent border border-brown text-black hover:bg-brown hover:text-white"
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
