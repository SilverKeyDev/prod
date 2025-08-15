import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";
import { CheckSquare } from "lucide-react";
import ChecklistCheckbox from "../../components/ChecklistCheckbox";
import ClosePageHeader from "../../components/ClosePageHeader";

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

export default function FinancingInsurance() {
  const [checked, setChecked] = useState<{ [id: number]: boolean }>({});
  const [loading, setLoading] = useState(false);

  const idsFromChecked = (state: { [id: number]: boolean }) =>
    Object.entries(state)
      .filter(([_, v]) => v)
      .map(([k]) => Number(k));

  // fetch existing checklist
  const fetchChecklist = async () => {
    console.info("📡 Fetching insurance checklist from API...");
    try {
      setLoading(true);
      const res = await apiRequest<number[]>("/api/v1/user/financing");
      if (res.success && Array.isArray(res.data)) {
        const mapping: { [id: number]: boolean } = {};
        res.data.forEach((id) => (mapping[id] = true));
        setChecked(mapping);
      }
    } catch (err) {
      console.error("❌ Failed to fetch insurance checklist", err);
    } finally {
      setLoading(false);
    }
  };

  const updateChecklist = async (newState: { [id: number]: boolean }) => {
    try {
      const body = idsFromChecked(newState);
      await apiRequest("/api/v1/user/financing", {
        method: "PUT",
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.error("❌ Failed to update insurance checklist", err);
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
      label: "Finalize mortgage application & submit docs",
      explanation:
        "Your lender needs detailed documentation to complete your mortgage. Submit everything promptly to avoid delays.",
      bullets: [
        "W-2s, pay stubs, bank statements, tax returns, ID, etc.",
        "Respond quickly to document or explanation requests.",
      ],
      resource: {
        label: "Mortgage Application Document Checklist",
        href: "https://www.investopedia.com/articles/pf/12/mortgage-loan-documents.asp",
      },
    },
    {
      id: 2,
      label: "Lock interest rate",
      explanation:
        "Locks protect you from rate increases while your loan is processed. Timing matters.",
      bullets: [
        "Discuss lock options (30, 45, 60 days) with your lender.",
        "You may be able to float or re-lock — ask about fees.",
      ],
      resource: {
        label: "What Is a Mortgage Rate Lock?",
        href: "https://www.nerdwallet.com/article/mortgages/mortgage-rate-lock",
      },
    },
    {
      id: 3,
      label: "Obtain underwriting approval / commitment",
      explanation:
        "Once your documents are reviewed, the underwriter issues conditional or final approval — a key milestone.",
      bullets: [
        "Conditional approval means more documents may be needed.",
        "Final approval (aka clear-to-close) means you're ready to sign.",
      ],
      resource: {
        label: "Underwriting Process Explained",
        href: "https://www.rocketmortgage.com/learn/what-is-underwriting",
      },
    },
    {
      id: 4,
      label: "Review Loan Estimate & Closing Disclosure",
      explanation:
        "These documents explain your loan terms, closing costs, and final amount due. Compare them carefully.",
      bullets: [
        "Loan Estimate comes within 3 business days of application.",
        "Closing Disclosure comes at least 3 business days before closing.",
      ],
      resource: {
        label: "CFPB Guide to Closing Disclosure",
        href: "https://www.consumerfinance.gov/owning-a-home/closing-disclosure/",
      },
    },
    {
      id: 5,
      label: "Shop & purchase homeowners insurance",
      explanation:
        "Homeowners insurance is required for financed homes. Compare coverage and premiums across providers.",
      bullets: [
        "Policy must be effective by your closing date.",
        "Coverage should meet lender minimums (usually full replacement cost).",
      ],
      resource: {
        label: "Homeowners Insurance Shopping Tips",
        href: "https://www.nerdwallet.com/best/homeowners-insurance",
      },
    },
    {
      id: 6,
      label: "Add flood or earthquake coverage if needed",
      explanation:
        "Standard homeowners insurance typically does not cover flood or earthquake damage.",
      bullets: [
        "Check FEMA maps and local seismic risk.",
        "Coverage may be required if your home is in a high-risk zone.",
      ],
      resource: {
        label: "Do I Need Flood or Earthquake Insurance?",
        href: "https://www.fema.gov/flood-insurance",
      },
    },
    {
      id: 7,
      label: "Send insurance binder to escrow / lender",
      explanation:
        "A binder is proof of active insurance and is required before funding. Your insurer can send it directly.",
      bullets: [
        "Include the lender as the mortgagee.",
        "Make sure policy start date matches your closing date.",
      ],
      resource: {
        label: "What Is an Insurance Binder?",
        href: "https://www.progressive.com/answers/insurance-binder/",
      },
    },
    {
      id: 8,
      label: "Prepare closing funds via secure wire",
      explanation:
        "You’ll need to send funds for closing (down payment + closing costs) a day or two before signing.",
      bullets: [
        "Get final amount and wiring instructions from escrow.",
        "Always verify wire instructions by phone to avoid fraud.",
      ],
      resource: {
        label: "Avoiding Real Estate Wire Fraud (FBI)",
        href: "https://www.fbi.gov/contact-us/field-offices/portland/news/press-releases/fbi-tech-tuesday-building-a-digital-defense-against-wire-transfer-fraud-in-real-estate-transactions",
      },
    },
    {
      id: 9,
      label: "Keep certified check backup for closing",
      explanation:
        "Some title companies require or allow a cashier’s check instead of a wire, especially for smaller amounts.",
      bullets: [
        "Check with your escrow officer about payment preferences.",
        "Personal checks are not accepted for closing funds.",
      ],
      resource: {
        label: "What Is a Cashier’s Check?",
        href: "https://www.bankrate.com/banking/what-is-a-cashiers-check/",
      },
    },
  ];

  const completedCount = Object.values(checked).filter(Boolean).length;
  const total = items.length;

  return (
    <div className="min-h-screen bg-off-white">
      <ClosePageHeader
        title="Financing & Insurance Checklist"
        subtitle="Stay on top of your loan and insurance tasks"
        completedCount={completedCount}
        totalCount={total}
        loading={loading}
      />

      {/* Checklist */}
      <div className="mx-auto px-12 py-10 max-w-4xl">
        {loading && <p className="mb-4">Loading checklist…</p>}
        <div className={sectionBox}>
          <div className={sectionTitle}>
            <CheckSquare className="h-5 w-5 text-brown" />
            Loan & Insurance Tasks
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
