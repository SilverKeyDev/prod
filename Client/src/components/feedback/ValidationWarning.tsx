import React from "react";

interface ValidationWarningProps {
  isVisible: boolean;
  onClose: () => void;
  onReview: () => void;
  missingFields: string[];
  errors: string[];
}

const ValidationWarning: React.FC<ValidationWarningProps> = ({
  isVisible,
  onReview,
  missingFields,
  errors,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 space-responsive-md">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">

        {/* Content */}
        <div className="space-responsive-lg space-y-responsive-md">
          {missingFields.length > 0 && (
            <div>
              <h4 className="text-responsive-sm font-medium text-gray-900 mb-3">
                The following required fields need to be completed:
              </h4>
              <div className="bg-red-50 border border-red-200 rounded-md space-responsive-sm">
                <ul className="space-y-responsive-xs">
                  {missingFields.map((field, index) => (
                    <li key={index} className="flex items-start gap-responsive-sm">
                      <span className="text-responsive-sm text-red-700">{field}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div>
              <h4 className="text-responsive-sm font-medium text-gray-900 mb-3">
                Please fix these issues:
              </h4>
              <div className="bg-amber-50 border border-amber-200 rounded-md space-responsive-sm">
                <ul className="space-y-responsive-xs">
                  {errors.map((error, index) => (
                    <li key={index} className="flex items-start gap-responsive-sm">
                      <span className="text-responsive-sm text-amber-700">{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-center space-responsive-lg border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onReview}
            className="px-responsive-md py-responsive-sm text-responsive-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brown transition-colors"
          >
            Review Information
          </button>
        </div>
      </div>
    </div>
  );
};

export default ValidationWarning;
