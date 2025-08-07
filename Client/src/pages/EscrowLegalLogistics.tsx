
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

export default function EscrowLegalLogistics() {
    const [checked, setChecked] = useState<{ [id: number]: boolean }>({});
  const [loading, setLoading] = useState(false);

  const idsFromChecked = (state: { [id: number]: boolean }) =>
    Object.entries(state)
      .filter(([_, v]) => v)
      .map(([k]) => Number(k));

  const fetchChecklist = async () => {
    console.info("📡 Fetching legal checklist from API...");
    try {
      setLoading(true);
      const res = await apiRequest<number[]>("/api/v1/user/legal");
      if (res.success && Array.isArray(res.data)) {
        const mapping: { [id: number]: boolean } = {};
        res.data.forEach((id) => (mapping[id] = true));
        setChecked(mapping);
      }
    } catch (err) {
      console.error("❌ Failed to fetch legal checklist", err);
    } finally {
      setLoading(false);
    }
  };

  const updateChecklist = async (newState: { [id: number]: boolean }) => {
    try {
      const body = idsFromChecked(newState);
      await apiRequest("/api/v1/user/legal", {
        method: "PUT",
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.error("❌ Failed to update legal checklist", err);
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
    { id: 1, label: "Choose/confirm escrow or title company" },
    { id: 2, label: "Deposit earnest money into escrow" },
    { id: 3, label: "Send purchase agreement to lender" },
    { id: 4, label: "Review escrow instructions" },
    { id: 5, label: "Monitor contingency deadlines" },
    { id: 6, label: "Order title search & review report" },
    { id: 7, label: "Check for liens/easements" },
    { id: 8, label: "Review zoning & hazard disclosures" },
    { id: 9, label: "Review HOA rules/financials if applicable" },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8">
            <h1 className="text-2xl font-semibold mb-4">Escrow & Legal Logistics</h1>
      {loading && <p className="mb-4">Loading checklist…</p>}
      <div className={sectionBox}>
        <h2 className={sectionTitle}>Legal & Title Tasks</h2>
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
