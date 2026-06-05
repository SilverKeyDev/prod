import React from "react";

import { Icon } from "@ui/icons";

import { useLocalization } from "packages/contexts";
import CancelButton from "packages/ui/components/actions/button/CancelButton";
import CloseButton from "packages/ui/components/actions/button/core/CloseButton";
import { Portal } from "packages/ui/components/structure/portal";
import { Box } from "packages/ui/components/structure/primitives";
import BodyText from "packages/ui/components/structure/text/BodyText";
import Title from "packages/ui/components/structure/text/Title";

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
  const dialogContent = (
    <Box className="z-modal fixed-modal-dashboard-main overflow-y-auto">
      <Box className="space-responsive-md flex min-h-screen w-full items-center justify-center">
        {/* Backdrop */}
        <Box
          role="button"
          tabIndex={0}
          className="bg-overlay-backdrop fixed-modal-dashboard-main transition-opacity"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClose();
            }
          }}
        />

        {/* Dialog */}
        <Box className="space-responsive-lg z-modal relative mx-auto w-full max-w-lg transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all">
          {/* Close button */}
          <CloseButton
            onClick={onClose}
            size="sm"
            className="touch-friendly z-header absolute right-4 top-4 text-gray-400 hover:text-gray-500"
          />

          {/* Warning Icon */}
          <Box className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Icon name="alert-circle" className="h-6 w-6 text-amber-600" />
          </Box>

          {/* Content */}
          <Box className="mb-6 text-center">
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
          </Box>

          {/* Missing Fields */}
          {missingFields.length > 0 && (
            <Box className="mb-6">
              <Title
                as="h4"
                size="sm"
                className="text-responsive-sm mb-3 font-medium text-gray-900"
              >
                {t("validation.required_fields_label")}
              </Title>
              <Box className="max-h-60 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 p-4">
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {missingFields.map((field, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Box className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                      {field}
                    </li>
                  ))}
                </ul>
              </Box>
            </Box>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Box className="mb-6">
              <Title
                as="h4"
                size="sm"
                className="text-responsive-sm mb-3 font-medium text-gray-900"
              >
                {t("validation.issues_to_fix_label")}
              </Title>
              <Box className="border-border max-h-40 overflow-y-auto rounded-lg border bg-red-50 p-4">
                <ul className="space-y-2">
                  {errors.map((error, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Box className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                      {error}
                    </li>
                  ))}
                </ul>
              </Box>
            </Box>
          )}

          {/* Actions */}
          <Box className="flex flex-col justify-center gap-3 sm:flex-row">
            <CancelButton onClick={onClose} size="md" className="min-w-24">
              {t("validation.review_information")}
            </CancelButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
  return <Portal>{dialogContent}</Portal>;
};
export default ValidationWarning;
