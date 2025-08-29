import React from "react";
import OnboardPersonalizeDropdown from "./OnboardPersonalizeDropdown";

interface OnboardPersonalizeBuyersAgentProps {
  hasBuyersAgent: string;
  lookingForBuyersAgent: boolean;
  onHasBuyersAgentChange: (value: string) => void;
  onLookingForBuyersAgentChange: (value: boolean) => void;
  isOpen: boolean;
  onToggle: () => void;
  dropdownRef: React.RefObject<HTMLDivElement>;
}

const BUYERS_AGENT_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const OnboardPersonalizeBuyersAgent: React.FC<OnboardPersonalizeBuyersAgentProps> = ({
  hasBuyersAgent,
  lookingForBuyersAgent,
  onHasBuyersAgentChange,
  onLookingForBuyersAgentChange,
  isOpen,
  onToggle,
  dropdownRef,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Buyer's Agent Dropdown */}
      <div>
        <label className="block text-xs sm:text-sm md:text-base font-medium text-black mb-2">
          Do you currently have a buyer's agent?
        </label>
        <OnboardPersonalizeDropdown
          value={hasBuyersAgent}
          onChange={onHasBuyersAgentChange}
          options={BUYERS_AGENT_OPTIONS}
          placeholder="Select..."
          isOpen={isOpen}
          onToggle={onToggle}
          dropdownRef={dropdownRef}
        />
      </div>

      {/* Show checkbox if user does NOT have a buyer's agent */}
      {hasBuyersAgent === "no" && (
        <div className="flex flex-col justify-center items-center h-full w-full md:mt-2">
          <div
            className="flex items-center gap-3 text-xs sm:text-sm md:text-base font-medium text-black cursor-pointer"
            onClick={() => onLookingForBuyersAgentChange(!lookingForBuyersAgent)}
          >
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                lookingForBuyersAgent
                  ? "bg-brown border-brown text-white shadow-sm"
                  : "border-gray-300 bg-gray-100 hover:border-gray-400"
              }`}
            >
              {lookingForBuyersAgent && (
                <svg
                  className="w-3 h-3"
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
            <span className="select-none text-xs sm:text-sm md:text-base">
              I am looking for a buyer's agent
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardPersonalizeBuyersAgent;
