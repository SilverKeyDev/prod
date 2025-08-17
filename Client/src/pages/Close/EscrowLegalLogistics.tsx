import { useEffect, useState } from "react";
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

export default function EscrowLegalLogistics() {
  const [checked, setChecked] = useState<{ [id: number]: boolean }>({});
  const [loading, setLoading] = useState(false);

  const idsFromChecked = (state: { [id: number]: boolean }) =>
    Object.entries(state)
      .filter(([_, v]) => v)
      .map(([k]) => Number(k));

  const fetchChecklist = async () => {
    console.info("📡 Fetching escrow checklist from API...");
    try {
      setLoading(true);
      const res = await apiRequest<number[]>("/api/v1/user/escrow");
      if (res.success && Array.isArray(res.data)) {
        const mapping: { [id: number]: boolean } = {};
        res.data.forEach((id) => (mapping[id] = true));
        setChecked(mapping);
      }
    } catch (err) {
      console.error("❌ Failed to fetch escrow checklist", err);
    } finally {
      setLoading(false);
    }
  };

  const updateChecklist = async (newState: { [id: number]: boolean }) => {
    try {
      const body = idsFromChecked(newState);
      await apiRequest("/api/v1/user/escrow", {
        method: "PUT",
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.error("❌ Failed to update escrow checklist", err);
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

  const items: ChecklistItem[] = [
    {
      id: 1,
      label: "Choose or confirm escrow/title company",
      explanation:
        "A neutral third party that holds funds, manages documents, and coordinates closing.",
      bullets: [
        "Get recommendations from your lender (and attorney if you’re using one).",
        "Verify licensing and reputation.",
        "They’ll prepare escrow instructions and handle fund transfers."
      ],
      resource: {
        label: "What is Escrow? (CFPB)",
        href: "https://www.consumerfinance.gov/ask-cfpb/what-is-escrow-en-123/"
      }
    },
    {
      id: 2,
      label: "Deposit earnest money into escrow",
      explanation:
        "Shows good faith and is credited toward your closing. Follow the contract timeline.",
      bullets: [
        "Commonly 1–3% of purchase price (varies by market).",
        "Due within 1–3 business days after acceptance (check contract).",
        "Call the escrow/title office to verify wire details—beware of fraud."
      ],
      resource: {
        label: "Avoid Real Estate Wire Fraud (FBI)",
        href: "https://www.fbi.gov/how-we-can-help-you/safety-resources/scams-and-safety/common-scams-and-crimes/business-email-compromise"
      }
    },
    {
      id: 3,
      label: "Send purchase agreement to lender",
      explanation:
        "Your lender needs the signed contract (and addenda) to start underwriting and order the appraisal.",
      bullets: [
        "Include counters/addenda and contact info for title/escrow.",
        "Confirm if title/escrow also needs a copy."
      ],
      resource: {
        label: "Purchase Agreement Basics (Realtor.com)",
        href: "https://www.realtor.com/advice/buy/what-is-a-purchase-and-sale-agreement/"
      }
    },
    {
      id: 4,
      label: "Review escrow instructions",
      explanation:
        "Spell out what the escrow holder must do and what conditions must be met before closing.",
      bullets: [
        "Verify names, property address, price, and timelines.",
        "Confirm contingencies and payoffs are listed correctly."
      ],
      resource: {
        label: "Escrow: How It Works in Real Estate (ALTA)",
        href: "https://www.alta.org/homebuyer/what-is-escrow/"
      }
    },
    {
      id: 5,
      label: "Monitor contingency deadlines",
      explanation:
        "Missing inspection/financing/appraisal/title deadlines can put your deposit at risk.",
      bullets: [
        "Track dates in a calendar with reminders.",
        "Coordinate with lender and title/escrow to stay on schedule."
      ],
      resource: {
        label: "Common Homebuying Contingencies (Nolo)",
        href: "https://www.nolo.com/legal-encyclopedia/contingency-clauses-home-purchase-contracts-30019.html"
      }
    },
    {
      id: 6,
      label: "Order title search & review report",
      explanation:
        "Confirms the seller’s ownership and flags claims or defects before you close.",
      bullets: [
        "Title company typically performs the search and issues the commitment.",
        "Read the preliminary report/commitment for exceptions and red flags."
      ],
      resource: {
        label: "Title Insurance Basics (First American)",
        href: "https://www.firstam.com/ownership/title-insurance/title-insurance-basics.html"
      }
    },
    {
      id: 7,
      label: "Check for liens, easements, and legal encumbrances",
      explanation:
        "These can affect ownership, access, or how you use the property.",
      bullets: [
        "Liens: unpaid taxes, judgments, HOA/contractor liens.",
        "Easements: utility access, shared driveways, ingress/egress."
      ],
      resource: {
        label: "Easements & Land Use Basics (Nolo)",
        href: "https://www.nolo.com/legal-encyclopedia/easements-land-use-basics-29651.html"
      }
    },
    {
      id: 8,
      label: "Review zoning and hazard disclosures",
      explanation:
        "Local zoning controls use/renovations; hazard zones can affect insurance and lender requirements.",
      bullets: [
        "Check flood, wildfire, or earthquake risk as applicable.",
        "Confirm zoning allows your intended use or projects."
      ],
      resource: {
        label: "FEMA Flood Map Service Center",
        href: "https://msc.fema.gov/portal/home"
      }
    },
    {
      id: 9,
      label: "Review HOA rules and financials (if applicable)",
      explanation:
        "Understand restrictions, fees, and the HOA’s financial health before you proceed.",
      bullets: [
        "Look for rules on rentals, pets, parking, exterior changes.",
        "Review budgets, reserves, assessments, and meeting minutes."
      ],
      resource: {
        label: "Reviewing HOA Documents Before Buying (Nolo)",
        href: "https://www.nolo.com/legal-encyclopedia/reviewing-hoa-documents-before-buying.html"
      }
    }
  ];

  const completedCount = Object.values(checked).filter(Boolean).length;
  const total = items.length;

  return (
    <>
      <ClosePageHeader
        title="Escrow & Legal Checklist"
        subtitle="Stay on top of the escrow and legal process"
        completedCount={completedCount}
        totalCount={total}
        loading={loading}
      />

      <div className="max-w-3xl mx-auto py-8">
        <div className={sectionBox}>
          <div className={sectionTitle}>
            <CheckSquare className="h-5 w-5 text-brown" />
            Legal & Title Tasks
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
    </>
  );
}
