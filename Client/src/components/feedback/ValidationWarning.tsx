import { AlertCircle, X } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

type ValidationWarningProps = {
  isVisible: boolean;
  onClose: () => void;
  onReview: () => void;
  missingFields: string[];
  errors: string[];
};

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
        className="space-responsive-md flex min-h-screen items-center justify-center"
        style={{ width: '100vw', height: '100vh' }}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
          style={{ left: 0, right: 0, top: 0, bottom: 0 }}
        />

        {/* Dialog */}
        <div
          className="space-responsive-lg relative z-[10000] mx-auto w-full max-w-lg transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all"
          style={{ maxWidth: '480px' }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="touch-friendly absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-500"
          >
            <X className="mobile-icon-md" aria-hidden="true" />
          </button>

          {/* Warning Icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>

          {/* Content */}
          <div className="mb-6 text-center">
            <h3 className="text-responsive-xl mb-2 font-semibold leading-6 text-gray-900">
              Complete Required Information
            </h3>
            <p className="text-responsive-sm text-gray-600">
              Please fill in the missing fields to continue with your onboarding.
            </p>
          </div>

          {/* Missing Fields */}
          {missingFields.length > 0 && (
            <div className="mb-6">
              <h4 className="text-responsive-sm mb-3 font-medium text-gray-900">
                Required Fields:
              </h4>
              <div className="max-h-60 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-4">
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {missingFields.map((field, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                      <span className="text-sm font-medium text-amber-800">{field}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-6">
              <h4 className="text-responsive-sm mb-3 font-medium text-gray-900">Issues to Fix:</h4>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-4">
                <ul className="space-y-2">
                  {errors.map((error, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                      <span className="text-sm text-red-800">{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onReview}
              className="touch-friendly inline-flex min-w-[140px] justify-center rounded-md border border-transparent bg-brown px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brown/90 focus:outline-none focus:ring-2 focus:ring-brown/50 focus:ring-offset-2"
            >
              Review Information
            </button>
            <button
              type="button"
              onClick={onClose}
              className="touch-friendly inline-flex min-w-[100px] justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2"
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
