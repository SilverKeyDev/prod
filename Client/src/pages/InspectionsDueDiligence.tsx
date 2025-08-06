import React from "react";

export default function InspectionsDueDiligence() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">Inspections & Due Diligence</h1>
      <p className="mb-6 text-gray-700">
        Ensure your future home is in good condition by following this inspections checklist.
      </p>
      <ul className="list-disc list-inside space-y-2">
        <li>Hire a general home inspector</li>
        <li>Schedule specialized inspections as needed (roof, sewer, HVAC, etc.)</li>
        <li>Review all seller disclosures</li>
        <li>Compare inspection and disclosure findings</li>
        <li>Request credits, repairs, or price reductions if necessary</li>
        <li>Decide whether to proceed or cancel under contingency</li>
        <li>Attend inspections and ask clarifying questions</li>
        <li>Research property taxes, utilities, and school ratings</li>
      </ul>
    </div>
  );
}
