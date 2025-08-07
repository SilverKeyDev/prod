import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import KeyLogo from "../components/KeyLogo";
import { CheckSquare } from "lucide-react";
import ChecklistCheckbox from "../components/ChecklistCheckbox";

const sectionBox =
  "bg-white rounded-xl shadow-sm p-6 mb-6 border border-beige/40";
const sectionTitle =
  "text-lg font-semibold text-navy flex items-center gap-3 mb-4";
const checkboxContainer = "flex items-start gap-3 mb-5";
const itemLabel = "font-medium text-navy";
const itemExplanation = "text-navy/80 text-sm mt-1 transition-opacity duration-300 ease-in-out";

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
        "The escrow or title company is a neutral third party that manages documents, funds, and coordinates closing.",
      bullets: [
        "Ask your agent or lender for recommendations.",
        "Ensure the company is licensed and reputable.",
        "They will prepare the escrow instructions and manage fund transfers.",
      ],
      resource: {
        label: "What is Escrow? (CFPB Guide)",
        href: "https://www.consumerfinance.gov/ask-cfpb/what-is-escrow-en-123/",
      },
    },
    {
      id: 2,
      label: "Deposit earnest money into escrow",
      explanation:
        "Earnest money shows you’re serious about the purchase. It's held in escrow and applied toward closing costs.",
      bullets: [
        "Typically 1–3% of the purchase price.",
        "Must be wired or delivered within 1–3 business days after offer acceptance.",
        "Avoid wire fraud — confirm details with escrow officer directly.",
      ],
      resource: {
        label: "FBI Guide: Avoid Wire Fraud",
        href: "https://www.fbi.gov/scams-and-safety/common-scams-and-crimes/business-email-compromise",
      },
    },
    {
      id: 3,
      label: "Send purchase agreement to lender",
      explanation:
        "Your lender needs a signed purchase agreement to begin processing your loan and schedule the appraisal.",
      bullets: [
        "Include any addendums or counteroffers.",
        "Check if the title/escrow company needs a copy too.",
      ],
      resource: {
        label: "Sample Purchase Agreement (Rocket Mortgage)",
        href: "https://www.rocketmortgage.com/learn/purchase-agreement",
      },
    },
    {
      id: 4,
      label: "Review escrow instructions",
      explanation:
        "Escrow instructions outline the duties of the escrow company and what must happen before closing.",
      bullets: [
        "Review for accuracy: names, address, sale price, timelines.",
        "Make sure contingencies and conditions are listed correctly.",
      ],
      resource: {
        label: "Escrow Instructions Explained",
        href: "https://homeguides.sfgate.com/escrow-instructions-mean-7972.html",
      },
    },
    {
      id: 5,
      label: "Monitor contingency deadlines",
      explanation:
        "Each contingency (inspection, financing, appraisal, etc.) has a deadline. Missing them can risk your deposit.",
      bullets: [
        "Track deadlines in a calendar or checklist.",
        "Communicate with your agent, lender, and escrow company to stay on schedule.",
      ],
      resource: {
        label: "Real Estate Contingency Timeline Guide",
        href: "https://www.opendoor.com/w/blog/real-estate-contingencies",
      },
    },
    {
      id: 6,
      label: "Order title search & review report",
      explanation:
        "A title search ensures the seller has the legal right to sell and identifies any claims against the property.",
      bullets: [
        "Usually handled by the title company.",
        "Review the preliminary title report for accuracy and red flags.",
      ],
      resource: {
        label: "Understanding Title Reports",
        href: "https://www.firstam.com/ownership/title-insurance/title-insurance-basics.html",
      },
    },
    {
      id: 7,
      label: "Check for liens, easements, and legal encumbrances",
      explanation:
        "These are restrictions or claims on the property that could affect your use or ownership.",
      bullets: [
        "Liens: unpaid taxes, HOA dues, or contractor fees.",
        "Easements: shared driveways, utility access.",
      ],
      resource: {
        label: "Easements & Liens Overview (Nolo)",
        href: "https://www.nolo.com/legal-encyclopedia/easements-land-use-basics-29651.html",
      },
    },
    {
      id: 8,
      label: "Review zoning and hazard disclosures",
      explanation:
        "Zoning laws affect what you can do with the property; hazard disclosures warn of risks (e.g., floods, fires).",
      bullets: [
        "Check if the property is in a flood, fire, or earthquake zone.",
        "Understand any zoning restrictions that could impact renovations or use.",
      ],
      resource: {
        label: "FEMA Flood Map Lookup",
        href: "https://msc.fema.gov/portal/home",
      },
    },
    {
      id: 9,
      label: "Review HOA rules and financials (if applicable)",
      explanation:
        "If the home is part of an HOA, review their rules, fees, and financials before proceeding.",
      bullets: [
        "Look for restrictions on short-term rentals, pets, exterior changes.",
        "Review recent budgets, reserves, and meeting minutes for red flags.",
      ],
      resource: {
        label: "HOA Document Checklist",
        href: "https://www.homeloanlearningcenter.com/mortgage-basics/the-hoa-document-checklist",
      },
    },
  ];
  
  const completedCount = Object.values(checked).filter(Boolean).length;
  const total = items.length;

  return (
    <>
      <div className="bg-white border-b border-beige/40 rounded-t-2xl mx-2 mt-4">
        <div className="mx-auto px-12 py-10">
          <div className="flex items-center gap-4 mb-4">
            <KeyLogo size="sm" />
            <div>
              <h1 className="text-2xl font-bold text-navy">Escrow & Legal Checklist</h1>
              <p className="text-navy/70">Stay on top of the escrow and legal process</p>
            </div>
          </div>
  
          {!loading && (
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
          )}
        </div>
      </div>
  
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