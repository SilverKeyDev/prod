import { useState, useEffect } from "react";
import {
  Check,
  Zap,
  Crown,
  Building,
  CreditCard,
  Calendar,
  Download,
  Loader2,
} from "lucide-react";
import { useStripePayment } from "../hooks/useStripePayment";

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
    features: ["5 reports", "Basic property analysis", "No expiration"],
  },
  {
    id: "20-reports",
    name: "20 Reports",
    price: 14.99,
    interval: "one-time",
    reportsLimit: 20,
    popular: true,
    features: [
      "20 reports",
      "Basic property analysis",
      "No expiration",
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
      "50 reports",
      "Basic property analysis",
      "No expiration",
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

interface SubscriptionStatus {
  reports_used: number;
  reports_limit: number;
  next_billing_date?: string;
  is_subscribed: boolean;
}

async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T | null; error?: string }> {
  try {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    const data = await response.json().catch(() => null);

    return {
      success: response.ok,
      data,
      ...(response.ok ? {} : { error: data?.error || "Request failed" }),
    };
  } catch (err: any) {
    console.error("apiRequest failed:", err);
    return { success: false, data: null, error: err.message };
  }
}

export default function Subscription() {
  const [activeTab, setActiveTab] = useState<"one-time" | "unlimited">("one-time");

  const [usage, setUsage] = useState({
    reportsUsed: 0,
    reportsLimit: 0,
    billingDate: new Date(),
    isSubscribed: false,
  });

  const { handleSubscription, loading: subscriptionLoading } = useStripePayment();

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await apiRequest<SubscriptionStatus>(
          "/api/v1/payment/subscription-status"
        );
        if (response.success && response.data) {
          setUsage({
            reportsUsed: response.data.reports_used || 0,
            reportsLimit: response.data.reports_limit || 0,
            billingDate: new Date(
              response.data.next_billing_date || Date.now()
            ),
            isSubscribed: response.data.is_subscribed || false,
          });
        }
      } catch (error) {
        console.error("Failed to fetch subscription status:", error);
      }
    };

    fetchSubscriptionStatus();
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-serif text-navy mb-4">
          Subscription & Billing
        </h1>
        <p className="text-lg text-navy/60 max-w-2xl mx-auto">
          Choose the perfect plan for your real estate business needs
        </p>
      </div>

      {/* Current Usage */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium text-navy">Current Usage</h2>
          <span className="px-3 py-1 bg-beige/30 text-navy text-sm font-medium rounded-full">
            {plans.find((p) => p.id === "5-reports")?.name} Plan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="h-8 w-8 text-gold" />
            </div>
            <div className="text-2xl font-bold text-navy mb-1">
              {usage.reportsUsed}/
              {usage.reportsLimit === -1 ? "∞" : usage.reportsLimit}
            </div>
            <div className="text-sm text-navy/60">Reports Used</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-8 w-8 text-navy" />
            </div>
            <div className="text-2xl font-bold text-navy mb-1">
              {formatDate(usage.billingDate)}
            </div>
            <div className="text-sm text-navy/60">Next Billing Date</div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CreditCard className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-navy mb-1">
              ${plans.find((p) => p.id === "5-reports")?.price || 0}
            </div>
            <div className="text-sm text-navy/60">Monthly Cost</div>
          </div>
        </div>

        {/* Usage Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-navy">Report Usage</span>
            <span className="text-sm text-navy/60">
              {usage.reportsLimit === -1
                ? "Unlimited"
                : `${usage.reportsLimit - usage.reportsUsed} remaining`}
            </span>
          </div>
          <div className="w-full bg-beige/30 rounded-full h-2">
            <div
              className="bg-gold h-2 rounded-full transition-all duration-300"
              style={{
                width:
                  usage.reportsLimit === -1
                    ? "20%"
                    : `${Math.min(
                        (usage.reportsUsed / usage.reportsLimit) * 100,
                        100
                      )}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center mb-8">
        <div className="bg-beige/20 rounded-lg p-1 flex items-center">
          <button
            onClick={() => setActiveTab("one-time")}
            className={`px-6 py-2 rounded text-sm font-medium transition-all ${
              activeTab === "one-time"
                ? "bg-white text-navy shadow-sm"
                : "text-navy/60 hover:text-navy"
            }`}
          >
            One-Time Purchase
          </button>
          <button
            onClick={() => setActiveTab("unlimited")}
            className={`px-6 py-2 rounded text-sm font-medium transition-all ${
              activeTab === "unlimited"
                ? "bg-white text-navy shadow-sm"
                : "text-navy/60 hover:text-navy"
            }`}
          >
            Unlimited Subscription
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => {
          const displayPrice = plan.price;

          return (
            <div
              key={plan.id}
              className={`
                relative card transition-all duration-200 hover:shadow-lg
                ${plan.popular ? "ring-2 ring-gold shadow-lg" : ""}
              `}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gold text-navy px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    plan.popular ? "bg-gold text-navy" : "bg-navy/10 text-navy"
                  }`}
                >
                  {getPlanIcon(plan.id)}
                </div>

                <h3 className="text-xl font-medium text-navy mb-2">
                  {plan.name}
                </h3>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-navy">
                    ${displayPrice.toFixed(2)}
                  </span>
                  <span className="text-navy/60">
                    {plan.interval === "year"
                      ? "/year"
                      : plan.interval === "month"
                      ? "/month"
                      : ""}
                  </span>
                  {plan.interval === "year" && (
                    <div className="text-sm text-green-600 font-medium">
                      Save 17% vs monthly
                    </div>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-navy/80 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscription(plan.id)}
                disabled={subscriptionLoading}
                className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center ${
                  plan.popular ? "btn-primary" : "btn-secondary"
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
