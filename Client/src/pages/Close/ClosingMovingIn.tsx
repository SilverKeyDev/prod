import { useState, useEffect } from "react";
import { apiRequest } from "../../lib/api";
import KeyLogo from "../../components/KeyLogo";
import { CheckSquare } from "lucide-react";
import ChecklistCheckbox from "../../components/ChecklistCheckbox";

const sectionBox =
  "bg-white rounded-xl shadow-sm p-6 mb-6 border border-beige/40";
const sectionTitle =
  "text-lg font-semibold text-navy flex items-center gap-3 mb-4";
const checkboxContainer = "flex items-start gap-3 mb-5";
const itemLabel = "font-medium text-navy";
const itemExplanation =
  "text-navy/80 text-sm mt-1 transition-opacity duration-300 ease-in-out";

interface ResourceLink {
  label: string;
  href?: string;
}

interface ChecklistItem {
  id: number;
  label: string;
  explanation: string;
  bullets?: string[];
  tip?: string;
  resource?: ResourceLink;
}

export default function ClosingMovingIn() {
  const [checked, setChecked] = useState<{ [id: number]: boolean }>({});
  const [loading, setLoading] = useState(false);

  const idsFromChecked = (state: { [id: number]: boolean }) =>
    Object.entries(state)
      .filter(([_, v]) => v)
      .map(([k]) => Number(k));

  const fetchChecklist = async () => {
    console.info("📡 Fetching closing checklist from API...");
    try {
      setLoading(true);
      const res = await apiRequest<number[]>("/api/v1/user/closing");
      console.debug("✅ API response", res);
      if (res.success && Array.isArray(res.data)) {
        const mapping: { [id: number]: boolean } = {};
        res.data.forEach((id) => (mapping[id] = true));
        setChecked(mapping);
      }
    } catch (err) {
      console.error("❌ Failed to fetch closing checklist", err);
    } finally {
      setLoading(false);
    }
  };

  const updateChecklist = async (newState: { [id: number]: boolean }) => {
    try {
      const body = idsFromChecked(newState);
      console.info("🚀 Sending updated checklist to API", body);
      await apiRequest("/api/v1/user/closing", {
        method: "PUT",
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.error("❌ Failed to update closing checklist", err);
    }
  };

  const toggle = (id: number) =>
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      // optimistic update
      updateChecklist(next);
      return next;
    });

  useEffect(() => {
    fetchChecklist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items: ChecklistItem[] = [
    {
      id: 1,
      label: "Conduct final walkthrough",
      explanation:
        "Confirm the home is in the same condition as when you made the offer and that agreed-upon repairs were completed.",
      bullets: [
        "Appliances and fixtures included in the sale are still there and functional.",
        "No new damage (e.g., water leaks, broken windows).",
        "Repairs from inspection negotiations were completed.",
        "The seller has fully vacated (unless negotiated otherwise).",
      ],
      resource: {
        label: "Final Walkthrough Checklist (Redfin Blog)",
        href: "https://www.redfin.com/blog/final-walk-through-checklist-before-closing-on-a-home/",
      },
    },
    {
      id: 2,
      label: "Review & sign closing documents",
      explanation:
        "Carefully review each document; ask your escrow officer or attorney for digital copies in advance.",
      bullets: [
        "Closing Disclosure – details loan terms, closing costs, and cash-to-close.",
        "ALTA Settlement Statement – line-by-line breakdown of buyer/seller debits and credits.",
        "Deed – transfers legal ownership from seller to you.",
        "Loan documents (if financing): note, mortgage, affidavits.",
      ],
      resource: {
        label: "CFPB Closing Disclosure Guide (Consumer Finance Official Guide)",
        href: "https://www.consumerfinance.gov/owning-a-home/closing-disclosure/",
      },
    },
    {
      id: 3,
      label: "Send closing funds",
      explanation:
        "Usually includes down payment and closing costs. Use a bank-certified wire; beware of fraud.",
      bullets: [
        "Title company will provide final numbers and wiring instructions.",
        "If check is allowed, bring a certified/cashier’s check (no personal checks).",
      ],
      resource: {
        label: "Protect Your Closing Funds (FBI Guide)",
        href: "https://www.fbi.gov/scams-and-safety/common-scams-and-crimes/business-email-compromise",
      },
    },
    {
      id: 4,
      label: "Recording & disbursement",
      explanation:
        "The title/escrow company records the deed with the county, then disburses funds. Usually within 1–2 business days.",
    },
    {
      id: 5,
      label: "Receive keys & access devices",
      explanation:
        "After recording/cleared funds, collect all access devices (keys, openers, fobs, security codes).",
    },
    {
      id: 6,
      label: "Change exterior locks",
      explanation:
        "You don’t know who else has keys (contractors, neighbors, past tenants).",
      bullets: [
        "Hire a locksmith (~$100–$200).",
        "Buy smart locks (Yale, August, Schlage).",
        "Rekey existing locks (cheaper than full replacement).",
      ],
      resource: {
        label: "How to Rekey a Lock (YouTube Tutorial)",
        href: "https://www.youtube.com/watch?v=UAZD6DQAOqM",
      },
    },
    {
      id: 7,
      label: "Transfer utilities",
      explanation: "Set services up a few days before closing to avoid gaps.",
      bullets: [
        "Electricity, water/sewer, natural gas, trash/recycling, internet & cable.",
      ],
      resource: {
        label: "MyUtilities.com or Utility Concierge",
        href: "https://www.myutilities.com/",
      },
    },
    {
      id: 8,
      label: "File homestead exemption",
      explanation:
        "Reduces property taxes if the home is your primary residence. Deadline varies by state.",
      resource: {
        label: "Search county tax assessor website",
        href: "https://www.tax-rates.org/",
      },
    },
    {
      id: 9,
      label: "Update mailing address",
      explanation:
        "Update USPS (mail forwarding 12 months, $1.10 fee) and key institutions (DMV, IRS, banks, healthcare, subscriptions).",
      resource: {
        label: "USPS Change of Address",
        href: "https://moversguide.usps.com/",
      },
    },
    {
      id: 10,
      label: "Secure important documents",
      explanation:
        "Create digital backups (cloud storage) and keep physical copies in a fireproof safe.",
      bullets: [
        "Closing Disclosure, deed, title insurance, loan docs, inspection report, warranties & manuals.",
      ],
    },
    {
      id: 11,
      label: "Create maintenance calendar",
      explanation: "Avoid costly repairs by staying proactive.",
      bullets: [
        "Replace HVAC filters every 1–3 months.",
        "Clean gutters biannually.",
        "Drain water heater yearly.",
      ],
      resource: {
        label: "HomeZada or Centriq",
        href: "https://www.homezada.com/",
      },
    },
    {
      id: 12,
      label: "Update estate plan",
      explanation:
        "Ensures your home passes to the right beneficiaries; consult an estate attorney if you own significant assets.",
    },
    {
      id: 13,
      label: "Join neighborhood or HOA group (optional)",
      explanation:
        "Benefits include staying informed, meeting neighbors, understanding HOA rules.",
      bullets: [
        "Find Facebook groups or Nextdoor.",
        "Check HOA website or attend a meeting.",
      ],
      resource: {
        label: "Find Your Neighborhood on Nextdoor",
        href: "https://nextdoor.com/find-neighborhood/",
      },
    },
  ];

  const completedCount = Object.values(checked).filter(Boolean).length;
  const total = items.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white text-navy">
        Loading checklist...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-white border-b border-beige/40 rounded-t-2xl mx-2 mt-4">
        <div className="mx-auto px-12 py-10">
          <div className="flex items-center gap-4 mb-4">
            <KeyLogo size="sm" />
            <div>
              <h1 className="text-2xl font-bold text-navy">
                Closing & Moving In Checklist
              </h1>
              <p className="text-navy/70">
                Track your progress toward a smooth transition into your new
                home
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <p className="text-sm text-navy/70 mb-1">
              {completedCount} of {total} items completed
            </p>
            <div className="w-full h-2 bg-beige/30 rounded">
              <div
                className="h-full bg-olive rounded transition-all duration-500"
                style={{ width: `${(completedCount / total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="mx-auto px-12 py-10 max-w-4xl">
        <div className={sectionBox}>
          <div className={sectionTitle}>
            <CheckSquare className="h-5 w-5 text-brown" />
            To-Do Items
          </div>

          <fieldset>
            <legend className="sr-only">Checklist</legend>
            {items.map((item) => (
              <ChecklistCheckbox
                key={item.id}
                item={item}
                checked={!!checked[item.id]}
                onToggle={() => toggle(item.id)}
                itemLabelClass={itemLabel}
                itemExplanationClass={itemExplanation}
                checkboxContainerClass={checkboxContainer}
              />
            ))}
          </fieldset>
        </div>
      </div>
    </div>
  );
}
