import { useState, useEffect } from "react";
import { apiRequest } from "../../lib/api";
import MiniLogo from "../../components/MiniLogo";
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

export default function InspectionsChecklist() {
  const [checked, setChecked] = useState<{ [id: number]: boolean }>({});
  const [loading, setLoading] = useState(false);

  const idsFromChecked = (state: { [id: number]: boolean }) =>
    Object.entries(state)
      .filter(([_, v]) => v)
      .map(([k]) => Number(k));

  // fetch existing checklist
  const fetchChecklist = async () => {
    console.info("📡 Fetching inspections checklist from API...");
    try {
      setLoading(true);
      const res = await apiRequest<number[]>("/api/v1/user/insurance");
      if (res.success && Array.isArray(res.data)) {
        const mapping: { [id: number]: boolean } = {};
        res.data.forEach((id) => (mapping[id] = true));
        setChecked(mapping);
      }
    } catch (err) {
      console.error("❌ Failed to fetch inspections checklist", err);
    } finally {
      setLoading(false);
    }
  };

  const updateChecklist = async (newState: { [id: number]: boolean }) => {
    try {
      const body = idsFromChecked(newState);
      await apiRequest("/api/v1/user/insurance", {
        method: "PUT",
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.error("❌ Failed to update inspections checklist", err);
    }
  };

  const toggle = (id: number) =>
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      updateChecklist(next);
      return next;
    });

  useEffect(() => {
    fetchChecklist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // placeholder (handled early)

  // toggle handled earlier

  const items: ChecklistItem[] = [
    {
      id: 1,
      label: "Hire a general home inspector",
      explanation:
        "Choose a certified inspector to evaluate the home's overall condition and identify potential issues.",
      bullets: [
        "Ask for referrals or check reviews online.",
        "Look for licensed inspectors with E&O insurance.",
      ],
      resource: {
        label: "How to Find a Home Inspector (NAR Guide)",
        href: "https://www.nar.realtor/research-and-statistics/quick-real-estate-statistics/home-inspections",
      },
    },
    {
      id: 2,
      label: "Schedule specialized inspections as needed",
      explanation:
        "Depending on the home type, age, or initial findings, consider hiring specialists for further evaluation.",
      bullets: [
        "Roof inspection",
        "Sewer scope",
        "HVAC system",
        "Mold, pest, or termite check",
      ],
      resource: {
        label: "Types of Home Inspections",
        href: "https://www.bankrate.com/real-estate/types-of-home-inspections/",
      },
    },
    {
      id: 3,
      label: "Review all seller disclosures",
      explanation:
        "Sellers are legally required to share known issues with the home. Review thoroughly to spot red flags.",
      bullets: [
        "Look for signs of past water damage, structural issues, or prior repairs.",
        "Disclosures vary by state — ask your agent or attorney for guidance.",
      ],
      resource: {
        label: "What Are Seller Disclosures?",
        href: "https://www.zillow.com/sellers-guide/what-are-seller-disclosures/",
      },
    },
    {
      id: 4,
      label: "Compare inspection and disclosure findings",
      explanation:
        "Use both sets of information to get a full picture of the home’s condition.",
      bullets: [
        "Confirm if disclosed issues were flagged in the inspection.",
        "Note any discrepancies to raise during negotiation.",
      ],
      resource: {
        label: "Reconciling Disclosures vs. Inspection",
        href: "https://www.homeadvisor.com/r/home-inspection-vs-seller-disclosure/",
      },
    },
    {
      id: 5,
      label: "Request credits, repairs, or price reductions if necessary",
      explanation:
        "You can negotiate with the seller to address issues discovered during inspections.",
      bullets: [
        "Ask for repairs to be completed before closing.",
        "Negotiate a closing credit or price reduction.",
        "Prioritize safety or major structural concerns.",
      ],
      resource: {
        label: "Repair Request Template & Strategy",
        href: "https://www.homelight.com/blog/buyer-home-inspection-repair-requests/",
      },
    },
    {
      id: 6,
      label: "Decide whether to proceed or cancel under contingency",
      explanation:
        "You can cancel the contract penalty-free during the inspection contingency period if issues are too severe.",
      bullets: [
        "Consult your agent or attorney before backing out.",
        "Make your decision before the deadline.",
      ],
      resource: {
        label: "Understanding Inspection Contingencies",
        href: "https://www.realtor.com/advice/buy/home-inspection-contingency/",
      },
    },
    {
      id: 7,
      label: "Attend inspections and ask clarifying questions",
      explanation:
        "Being present lets you hear the inspector’s commentary and ask questions in real time.",
      bullets: [
        "You’ll often gain more insight than what’s written in the report.",
        "Bring a notepad or record audio with permission.",
      ],
      resource: {
        label: "Why You Should Attend Your Home Inspection",
        href: "https://www.bankrate.com/real-estate/should-you-attend-home-inspection/",
      },
    },
    {
      id: 8,
      label: "Research property taxes, utilities, and school ratings",
      explanation:
        "These ongoing costs and community factors can impact long-term affordability and resale value.",
      bullets: [
        "Use public records or request a SilverKey Report for one-click answers.",
        "Check utility averages and verify school ratings.",
      ],
      resource: {
        label: "Check Home Data with SilverKey",
        href: "https://silverkeyestates.com/",
      },
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white text-navy">
        Loading checklist...
      </div>
    );
  }

  const completedCount = Object.values(checked).filter(Boolean).length;
  const total = items.length;

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-white border-b border-beige/40 rounded-t-2xl mx-2 mt-4">
        <div className="mx-auto px-12 py-10">
          <div className="flex items-center gap-4 mb-4">
          <MiniLogo size="lg" />
          <div>
              <h1 className="text-2xl font-bold text-navy">
                Inspection & Due Diligence Checklist
              </h1>
              <p className="text-navy/70">
                Follow these steps to make an informed decision before closing
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
