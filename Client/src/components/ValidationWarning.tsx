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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">

        {/* Content */}
        <div className="p-6 space-y-4">
          {missingFields.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                The following required fields need to be completed:
              </h4>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <ul className="space-y-1">
                  {missingFields.map((field, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-sm text-red-700">{field}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Please fix these issues:
              </h4>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <ul className="space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-sm text-amber-700">{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-center p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onReview}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brown transition-colors"
          >
            Review Information
          </button>
        </div>
      </div>
    </div>
  );
};

export default ValidationWarning;
