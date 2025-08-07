import { useState, useEffect } from "react";
import KeyLogo from "../components/KeyLogo";
import { CheckSquare } from "lucide-react";

const sectionBox =
  "bg-white rounded-xl shadow-sm p-6 mb-6 border border-beige/40";
const sectionTitle =
  "text-lg font-semibold text-navy flex items-center gap-3 mb-4";
const checkboxContainer = "flex items-start gap-3 mb-5";
const checkboxInput =
  "mt-1 h-5 w-5 text-olive border-beige rounded focus:ring-olive";
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

  const toggle = (id: number) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const resetChecklist = () => {
    setChecked({});
    localStorage.removeItem("inspectionsChecklist");
  };

  useEffect(() => {
    const saved = localStorage.getItem("inspectionsChecklist");
    if (saved) {
      try {
        setChecked(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse saved checklist:", err);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("inspectionsChecklist", JSON.stringify(checked));
  }, [checked]);

  const items: ChecklistItem[] = [
    {
      id: 1,
      label: "Hire a general home inspector",
      explanation: "Choose a certified inspector to evaluate the overall condition of the home.",
    },
    {
      id: 2,
      label: "Schedule specialized inspections as needed",
      explanation:
        "Based on the general inspector’s findings or property type, consider specialists for further evaluation.",
      bullets: [
        "Roof inspection",
        "Sewer scope",
        "HVAC system",
        "Mold, pest, or termite check",
      ],
    },
    {
      id: 3,
      label: "Review all seller disclosures",
      explanation:
        "Understand known issues with the property as reported by the seller. These are typically required by law.",
    },
    {
      id: 4,
      label: "Compare inspection and disclosure findings",
      explanation:
        "Look for discrepancies or confirmation between what inspectors found and what sellers disclosed.",
    },
    {
      id: 5,
      label: "Request credits, repairs, or price reductions if necessary",
      explanation:
        "Negotiate based on findings. You can ask for repairs to be completed, request credits, or lower the offer price.",
    },
    {
      id: 6,
      label: "Decide whether to proceed or cancel under contingency",
      explanation:
        "Use your inspection contingency period to exit the contract penalty-free if serious issues arise.",
    },
    {
      id: 7,
      label: "Attend inspections and ask clarifying questions",
      explanation:
        "Be present if possible — you’ll gain insights that aren’t always in the final report.",
    },
    {
      id: 8,
      label: "Research property taxes, utilities, and school ratings",
      explanation:
        "Evaluate the financial and lifestyle aspects of the area before moving forward.",
      bullets: [
        "Look up local tax rates via the county assessor",
        "Estimate average utility costs",
        "Review nearby school scores on GreatSchools.org or Niche",
      ],
    },
  ];

  const completedCount = Object.values(checked).filter(Boolean).length;
  const total = items.length;

  return (
    <div className="min-h-screen bg-off-white">
      {/* Header */}
      <div className="bg-white border-b border-beige/40 rounded-t-2xl mx-2 mt-4">
        <div className="mx-auto px-12 py-10">
          <div className="flex items-center gap-4 mb-4">
            <KeyLogo size="sm" />
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
              <div key={item.id} className={checkboxContainer}>
                <input
                  id={`item-${item.id}`}
                  type="checkbox"
                  className={checkboxInput}
                  checked={!!checked[item.id]}
                  onChange={() => toggle(item.id)}
                  aria-label={item.label}
                />
                <label htmlFor={`item-${item.id}`} className="flex-1">
                  <span className={itemLabel}>{item.label}</span>
                  {!checked[item.id] && (
                    <div>
                      <p className={itemExplanation}>{item.explanation}</p>
                      {item.bullets && (
                        <ul className="list-disc list-inside text-navy/70 ml-4 mt-2 space-y-1">
                          {item.bullets.map((b, idx) => (
                            <li key={idx}>{b}</li>
                          ))}
                        </ul>
                      )}
                      {item.resource && (
                        <p className="text-olive text-sm mt-2">
                          {item.resource.href ? (
                            <a
                              href={item.resource.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline hover:text-olive/80"
                            >
                              {item.resource.label}
                            </a>
                          ) : (
                            item.resource.label
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </label>
              </div>
            ))}
          </fieldset>
        </div>
      </div>
    </div>
  );
}
