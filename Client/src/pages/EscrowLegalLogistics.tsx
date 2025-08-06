import React from "react";

export default function EscrowLegalLogistics() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">Escrow & Legal Logistics</h1>
      <p className="mb-6 text-gray-700">
        This section will guide you through escrow and legal steps during the closing phase. Follow the checklist and consult your agent or attorney for any clarifications.
      </p>
      <ul className="list-disc list-inside space-y-2">
        <li>Choose or confirm escrow/title company</li>
        <li>Open escrow and deposit earnest money</li>
        <li>Notify your lender and send purchase agreement</li>
        <li>Review escrow instructions</li>
        <li>Monitor contingency deadlines</li>
        <li>Order title search and review preliminary title report</li>
        <li>Check for liens, easements, and legal encumbrances</li>
        <li>Review zoning and hazard disclosures</li>
        <li>Understand HOA rules and financials (if applicable)</li>
      </ul>
    </div>
  );
}
