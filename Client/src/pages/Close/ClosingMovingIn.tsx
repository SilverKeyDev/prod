import { useState, useEffect } from "react";
import { apiRequest } from "../../lib/api";
import { CheckSquare } from "lucide-react";
import ChecklistCheckbox from "../../components/ui/ChecklistCheckbox";
import ClosePageHeader from "../../components/ui/ClosePageHeader";

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
        label: "How to Send Closing Funds (Zillow Guide)",
        href: "https://www.zillow.com/learn/how-to-wire-money-for-closing/",
      },
    },
    {
      id: 4,
      label: "Recording & disbursement",
      explanation:
        "The title/escrow company records the deed with the county, then disburses funds. Usually within 1–2 business days.",
      resource: {
        label: "The Escrow Timeline (Linear Title and Escrow)",
        href: "https://lineartitleandescrow.com/2023/12/06/the-escrow-timeline-a-step-by-step-guide-to-closing/",
      },
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
        href: "https://www.youtube.com/watch?v=JWrRQXj8DUI",
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
        label: "Guide to Transferring Utilities (Zillow)",
        href: "https://www.zillow.com/learn/transferring-utilities-when-buying-a-house/?utm_source=chatgpt.com",
      },
    },
    {
      id: 8,
      label: "File homestead exemption",
      explanation:
        "A homestead exemption can reduce your property taxes if the home is your primary residence. You must file with your local county tax assessor or appraisal district. Deadlines and rules vary by state, and many require filing within the first year of ownership.",
      bullets: [
        "Confirm you meet eligibility requirements (primary residence).",
        "Find your county’s official tax assessor or appraisal district website.",
        "Complete the homestead exemption application form.",
        "Submit by your state or county’s deadline to receive the benefit.",
      ],
      resource: {
        label: "Find Your County Tax Assessor",
        href: "https://publicrecords.netronline.com/propertyrecords/",
      },
    },
    {
      id: 9,
      label: "Update mailing address",
      explanation:
        "Update USPS (mail forwarding 12 months, $1.10 fee) and key institutions (DMV, IRS, banks, healthcare, subscriptions).",
      resource: {
        label: "Change Your Address – USA.gov",
        href: "https://www.usa.gov/change-address",
      },
    },
    {
      id: 10,
      label: "Create maintenance calendar",
      explanation: "Avoid costly repairs by staying proactive.",
      bullets: [
        "Replace HVAC filters every 1–3 months.",
        "Clean gutters biannually.",
        "Drain water heater yearly.",
      ],
    },
    {
      id: 11,
      label: "Update estate plan",
      explanation:
        "Ensures your home passes to the right beneficiaries; consult an estate attorney if you own significant assets.",
    },
    {
      id: 12,
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
      <ClosePageHeader
        title="Closing & Moving In Checklist"
        subtitle="Track your progress toward a smooth transition into your new home"
        completedCount={completedCount}
        totalCount={total}
        loading={loading}
      />

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
