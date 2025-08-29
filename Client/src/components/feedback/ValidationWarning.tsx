import React from "react";
import { createPortal } from "react-dom";
import { AlertCircle, X } from "lucide-react";

interface ValidationWarningProps {
  isVisible: boolean;
  onClose: () => void;
  onReview: () => void;
  missingFields: string[];
  errors: string[];
}

const ValidationWarning: React.FC<ValidationWarningProps> = ({
  isVisible,
  onClose,
  onReview,
  missingFields,
  errors,
}) => {
  if (!isVisible) return null;

  const dialogContent = (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto"
      style={{ left: 0, right: 0, top: 0, bottom: 0 }}
    >
      <div
        className="flex min-h-screen items-center justify-center space-responsive-md"
        style={{ width: "100vw", height: "100vh" }}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
          style={{ left: 0, right: 0, top: 0, bottom: 0 }}
        />

        {/* Dialog */}
        <div
          className="relative z-[10000] w-full max-w-lg mx-auto transform overflow-hidden rounded-2xl bg-white space-responsive-lg text-left shadow-xl transition-all"
          style={{ maxWidth: "480px" }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-500 touch-friendly z-10"
          >
            <X className="mobile-icon-md" aria-hidden="true" />
          </button>

          {/* Warning Icon */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-amber-100 rounded-full">
            <AlertCircle className="w-6 h-6 text-amber-600" />
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h3 className="text-responsive-xl font-semibold leading-6 text-gray-900 mb-2">
              Complete Required Information
            </h3>
            <p className="text-responsive-sm text-gray-600">
              Please fill in the missing fields to continue with your onboarding.
            </p>
          </div>

          {/* Missing Fields */}
          {missingFields.length > 0 && (
            <div className="mb-6">
              <h4 className="text-responsive-sm font-medium text-gray-900 mb-3">
                Required Fields:
              </h4>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {missingFields.map((field, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                      <span className="text-sm text-amber-800 font-medium">{field}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-6">
              <h4 className="text-responsive-sm font-medium text-gray-900 mb-3">
                Issues to Fix:
              </h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                <ul className="space-y-2">
                  {errors.map((error, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0 mt-2" />
                      <span className="text-sm text-red-800">{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={onReview}
              className="inline-flex justify-center rounded-md border border-transparent bg-brown px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-brown/90 focus:outline-none focus:ring-2 focus:ring-brown/50 focus:ring-offset-2 transition-colors touch-friendly min-w-[140px]"
            >
              Review Information
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 transition-colors touch-friendly min-w-[100px]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
};

export default ValidationWarning;
