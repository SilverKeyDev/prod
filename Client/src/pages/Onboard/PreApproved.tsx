import React, { useState, useEffect } from "react";
import PageHeader from "../../components/ui/PageHeader";
import { useData } from "../../contexts/DataContext";

type FormData = {
  name: string;
  income: string;       // monthly, numeric string
  creditScore: string;  // numeric string
  debts: string;        // monthly, numeric string
};

const PreApproved: React.FC = () => {
  const { userPreferences, userProfile } = useData();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    income: "",
    creditScore: "",
    debts: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showIframe, setShowIframe] = useState(false);
  const [iframeUrl, setIframeUrl] = useState("");

  // Autofill name from user preferences or profile
  useEffect(() => {
    const name =
      userPreferences?.demographics?.full_name || userProfile?.name || "";
    if (name) {
      setFormData((prev) => ({ ...prev, name }));
    }
  }, [userPreferences, userProfile]);

  const sanitizeCurrencyNumber = (v: string) =>
    v.replace(/[^\d.]/g, "").replace(/^0+(?=\d)/, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    const income = sanitizeCurrencyNumber(formData.income);
    const debts = sanitizeCurrencyNumber(formData.debts);
    const creditScore = sanitizeCurrencyNumber(formData.creditScore);

    if (!formData.name.trim()) return setError("Please enter your full name.");
    if (!income || Number(income) <= 0)
      return setError("Monthly income must be a positive number.");
    if (!debts && debts !== "0")
      return setError("Please enter your monthly debts (0 if none).");
    if (!creditScore || Number(creditScore) < 300 || Number(creditScore) > 850)
      return setError("Credit score must be between 300 and 850.");

    setLoading(true);
    try {
      // Call your backend to create a provider session and return a hosted URL
      const res = await fetch("/api/preapproval/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name.trim(),
          monthly_income: Number(income),
          monthly_debts: Number(debts),
          credit_score: Number(creditScore),
          // Optional: include a postback/return URL so provider can redirect back
          return_url: `${window.location.origin}/dashboard/get-preapproved?status=done`,
          metadata: {
            source: "silverkey",
            user_id: userProfile?.id ?? null,
          },
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to start pre-approval session.");
      }

      const data = (await res.json()) as { url: string };
      if (!data?.url) throw new Error("Provider URL missing from response.");

      setIframeUrl(data.url);
      setShowIframe(true);
    } catch (err: any) {
      setError(err?.message || "Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (showIframe) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <button
            onClick={() => setShowIframe(false)}
            className="mb-4 px-4 py-2 bg-brown text-white rounded"
          >
            Back to Form
          </button>

          {/* Consider setting a CSP frame-src to only allow your provider domain */}
          <iframe
            src={iframeUrl}
            width="100%"
            height="720"
            title="Mortgage Pre-Approval"
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
            allow="clipboard-read; clipboard-write; accelerometer; autoplay; camera; microphone; payment; geolocation"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white">
      <PageHeader
        title="Get Pre-Approved"
        subtitle="Connect with our lending partner to get pre-approved for a mortgage"
      />
      <div className="max-w-2xl mx-auto px-4">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>
          )}

          <label className="block">
            <span className="text-sm text-navy/70">Full Name</span>
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full p-3 border rounded"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm text-navy/70">Monthly Income (before taxes)</span>
            <input
              inputMode="decimal"
              placeholder="e.g., 7500"
              value={formData.income}
              onChange={(e) =>
                setFormData({ ...formData, income: sanitizeCurrencyNumber(e.target.value) })
              }
              className="mt-1 w-full p-3 border rounded"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm text-navy/70">Credit Score</span>
            <input
              inputMode="numeric"
              placeholder="e.g., 740"
              value={formData.creditScore}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  creditScore: e.target.value.replace(/[^\d]/g, "").slice(0, 3),
                })
              }
              className="mt-1 w-full p-3 border rounded"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm text-navy/70">Monthly Debts (payments)</span>
            <input
              inputMode="decimal"
              placeholder="e.g., 400"
              value={formData.debts}
              onChange={(e) =>
                setFormData({ ...formData, debts: sanitizeCurrencyNumber(e.target.value) })
              }
              className="mt-1 w-full p-3 border rounded"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brown text-white py-3 rounded hover:bg-brown/90 disabled:opacity-60"
          >
            {loading ? "Starting…" : "Start Pre-Approval"}
          </button>

          <p className="text-xs text-navy/60">
            By continuing, you agree to share this information with our mortgage partner for the
            purpose of pre-approval. We do not store your SSN on our servers.
          </p>
        </form>
      </div>
    </div>
  );
};

export default PreApproved;
