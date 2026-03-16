import { Icon } from "@ui/icons";

import { Box } from "packages/ui/components/primitives";

import { BodyText, Button } from "@/components/ui";
import type { AgreementRevision } from "@/features/documents/types/agreements";
import { formatAgreementDateTime } from "@/features/documents/utils/agreements";

import RevisionUpload from "./RevisionUpload";
type AgreementRevisionsTabProps = {
  agreementId: string;
  revisions: AgreementRevision[];
  userCanCreateRevision: boolean;
  showRevisionUpload: boolean;
  onUploadClick: () => void;
  onUploadSuccess: () => void;
  onUploadCancel: () => void;
  onDownloadClick: (revisionId: string) => void;
};
/**
 * AgreementRevisionsTab Component
 *
 * Displays agreement revision history with upload capability
 */
export default function AgreementRevisionsTab({
  agreementId,
  revisions,
  userCanCreateRevision,
  showRevisionUpload,
  onUploadClick,
  onUploadSuccess,
  onUploadCancel,
  onDownloadClick,
}: AgreementRevisionsTabProps) {
  return (
    <Box className="flex flex-col gap-4">
      {userCanCreateRevision && (
        <Box className="mb-4">
          {!showRevisionUpload ? (
            <Button variant="primary" size="md" onClick={onUploadClick}>
              Upload Revision
            </Button>
          ) : (
            <Box className="rounded-lg border border-gray-200 p-4">
              <RevisionUpload
                agreementId={agreementId}
                onSuccess={onUploadSuccess}
                onCancel={onUploadCancel}
              />
            </Box>
          )}
        </Box>
      )}

      {revisions.length > 0 ? (
        <Box className="flex flex-col gap-3">
          {revisions.map((revision) => (
            <Box
              key={revision.id}
              className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50 active:bg-gray-100 active:bg-gray-50"
            >
              <Box className="flex flex-row items-start justify-between">
                <Box className="flex flex-row items-start gap-3">
                  <Icon name="file-text" className="mt-0.5 h-5 w-5 text-gray-600" />
                  <Box>
                    <BodyText as="p" className="font-medium text-gray-900">
                      {revision.file_name}
                    </BodyText>
                    <BodyText as="p" size="xs" className="mt-0.5 text-gray-500">
                      Revision #{revision.revision_number} •{" "}
                      {(revision.file_size / 1024).toFixed(1)} KB •{" "}
                      {formatAgreementDateTime(revision.created_at)}
                    </BodyText>
                    {revision.notes && (
                      <BodyText as="p" size="sm" className="mt-1 text-gray-600">
                        {revision.notes}
                      </BodyText>
                    )}
                    {revision.created_by_name && (
                      <BodyText as="p" size="xs" className="mt-1 text-gray-500">
                        By {revision.created_by_name}
                      </BodyText>
                    )}
                  </Box>
                </Box>
                <Button variant="ghost" size="sm" onClick={() => onDownloadClick(revision.id)}>
                  <Icon name="download" className="h-4 w-4" />
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Box className="py-8 text-center">
          <BodyText className="text-center" size="sm" muted>
            No revisions uploaded yet
          </BodyText>
        </Box>
      )}
    </Box>
  );
}
