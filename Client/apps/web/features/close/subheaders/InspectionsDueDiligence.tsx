import CloseLayout, { type ChecklistItem } from "../CloseLayout";

type ClosePageHeaderData = {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
  loading: boolean;
};

type InspectionsDueDiligenceProps = {
  setClosePageHeaderData: React.Dispatch<
    React.SetStateAction<ClosePageHeaderData | null>
  >;
};

export default function InspectionsChecklist({
  setClosePageHeaderData,
}: InspectionsDueDiligenceProps) {
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
        href: "https://usesilverkey.com",
      },
    },
  ];

  return (
    <CloseLayout
      title="Inspection & Due Diligence"
      subtitle="Follow these steps to make an informed decision before closing"
      sectionTitle="To-Do Items"
      apiEndpoint="/api/v1/user/close?type=insurance"
      items={items}
      showLoadingScreen={true}
      setClosePageHeaderData={setClosePageHeaderData}
    />
  );
}
