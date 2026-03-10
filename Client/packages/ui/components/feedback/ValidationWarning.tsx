import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import { spacing } from "packages/design-tokens";

import { BodyText, CancelButton, CloseButton, Portal, Title } from "@/components/ui";
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
  missingFields,
  errors,
}) => {
  const { t } = useLocalization();
  if (!isVisible) return null;
  const insetZero = {
    left: spacing(0),
    right: spacing(0),
    top: spacing(0),
    bottom: spacing(0),
  };
  const dialogContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={insetZero}>
      <div
        className="space-responsive-md flex min-h-screen items-center justify-center"
        style={{ width: "100vw", height: "100vh" }}
      >
        {/* Backdrop */}
        <div
          role="button"
          tabIndex={0}
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClose();
            }
          }}
          style={insetZero}
        />

        {/* Dialog */}
        <div className="space-responsive-lg relative z-50 mx-auto w-full max-w-lg transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all">
          {/* Close button */}
          <CloseButton
            onClick={onClose}
            size="sm"
            className="touch-friendly absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-500"
          />

          {/* Warning Icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Icon name="alert-circle" className="h-6 w-6 text-amber-600" />
          </div>

          {/* Content */}
          <div className="mb-6 text-center">
            <Title
              as="h3"
              size="lg"
              className="text-responsive-xl mb-2 font-semibold leading-6 text-gray-900"
            >
              {t("validation.complete_required_title")}
            </Title>
            <BodyText as="p" size="sm" className="text-responsive-sm text-gray-600">
              {t("validation.complete_required_description")}
            </BodyText>
          </div>

          {/* Missing Fields */}
          {missingFields.length > 0 && (
            <div className="mb-6">
              <Title
                as="h4"
                size="sm"
                className="text-responsive-sm mb-3 font-medium text-gray-900"
              >
                {t("validation.required_fields_label")}
              </Title>
              <div className="max-h-60 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-4">
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {missingFields.map((field, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-6">
              <Title
                as="h4"
                size="sm"
                className="text-responsive-sm mb-3 font-medium text-gray-900"
              >
                {t("validation.issues_to_fix_label")}
              </Title>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-4">
                <ul className="space-y-2">
                  {errors.map((error, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <CancelButton onClick={onClose} size="md" className="min-w-24">
              {t("validation.review_information")}
            </CancelButton>
          </div>
        </div>
      </div>
    </div>
  );
  return <Portal>{dialogContent}</Portal>;
};
export default ValidationWarning;
