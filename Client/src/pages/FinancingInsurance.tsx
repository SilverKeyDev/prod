import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import OliveCheckbox from "../components/OliveCheckbox";

const sectionBox =
  "bg-white rounded-xl shadow-sm p-6 mb-6 border border-beige/40";
const sectionTitle =
  "text-lg font-semibold text-navy flex items-center gap-3 mb-4";
const checkboxContainer = "flex items-start gap-3 mb-5";

interface ChecklistItem {
  id: number;
  label: string;
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
      const res = await apiRequest<number[]>("/api/v1/user/insurance");
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
      await apiRequest("/api/v1/user/insurance", {
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
    { id: 1, label: "Finalize mortgage application & submit docs" },
    { id: 2, label: "Lock interest rate" },
    { id: 3, label: "Obtain underwriting approval / commitment" },
    { id: 4, label: "Review Loan Estimate & Closing Disclosure" },
    { id: 5, label: "Shop & purchase homeowners insurance" },
    { id: 6, label: "Add flood/earthquake coverage if needed" },
    { id: 7, label: "Send insurance binder to escrow / lender" },
    { id: 8, label: "Prepare closing funds via secure wire" },
    { id: 9, label: "Keep certified check backup for closing" },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8">
            <h1 className="text-2xl font-semibold mb-4">Financing & Insurance</h1>
      {loading && <p className="mb-4">Loading checklist…</p>}
      <div className={sectionBox}>
        <h2 className={sectionTitle}>Loan & Insurance Tasks</h2>
        {items.map((item) => (
          <div key={item.id} className={checkboxContainer}>
            <OliveCheckbox
              checked={!!checked[item.id]}
              onToggle={() => toggle(item.id)}
            />
            <span className="text-navy">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
