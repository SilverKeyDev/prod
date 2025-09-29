import React from "react";

import Dropdown from "../../components/ui/form/Dropdown";

type OnPerBuyersAgentProps = {
  hasBuyersAgent: string;
  lookingForBuyersAgent: boolean;
  onHasBuyersAgentChange: (value: string) => void;
  onLookingForBuyersAgentChange: (value: boolean) => void;
};

const BUYERS_AGENT_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const OnPerBuyersAgent: React.FC<OnPerBuyersAgentProps> = ({
  hasBuyersAgent,
  lookingForBuyersAgent,
  onHasBuyersAgentChange,
  onLookingForBuyersAgentChange,
}) => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Buyer's Agent Dropdown */}
      <div>
        <label className="mb-2 block text-xs font-medium text-black sm:text-sm md:text-base">
          Do you currently have a buyer's agent?
        </label>
        <Dropdown
          value={hasBuyersAgent}
          onChange={onHasBuyersAgentChange}
          options={BUYERS_AGENT_OPTIONS}
          placeholder="Select..."
        />
      </div>

      {/* Show checkbox if user does NOT have a buyer's agent */}
      {hasBuyersAgent === "no" && (
        <div className="flex h-full w-full flex-col items-center justify-center md:mt-2">
          <div
            className="flex cursor-pointer items-center gap-3 text-xs font-medium text-black sm:text-sm md:text-base"
            onClick={() =>
              onLookingForBuyersAgentChange(!lookingForBuyersAgent)
            }
          >
            <div
              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all duration-200 ${
                lookingForBuyersAgent
                  ? "border-brown bg-brown text-white shadow-sm"
                  : "border-gray-300 bg-gray-100 hover:border-gray-400"
              }`}
            >
              {lookingForBuyersAgent && (
                <svg
                  className="h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            I am looking for a buyer's agent
          </div>
        </div>
      )}
    </div>
  );
};

export default OnPerBuyersAgent;
