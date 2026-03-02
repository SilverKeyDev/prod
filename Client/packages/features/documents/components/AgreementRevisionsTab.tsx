import { Download, FileText } from "lucide-react";

import { BodyText, Button } from "packages/ui/components/index.web";

import type { AgreementRevision } from "@/features/documents/types/docusign";
import { formatAgreementDateTime } from "@/features/documents/utils/docusignHelpers";

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
    <div className="space-y-4">
      {userCanCreateRevision && (
        <div className="mb-4">
          {!showRevisionUpload ? (
            <Button variant="primary" size="md" onClick={onUploadClick}>
              Upload Revision
            </Button>
          ) : (
            <div className="rounded-lg border border-gray-200 p-4">
              <RevisionUpload
                agreementId={agreementId}
                onSuccess={onUploadSuccess}
                onCancel={onUploadCancel}
              />
            </div>
          )}
        </div>
      )}

      {revisions.length > 0 ? (
        <div className="space-y-3">
          {revisions.map((revision) => (
            <div
              key={revision.id}
              className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-5 w-5 text-gray-600" />
                  <div>
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
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onDownloadClick(revision.id)}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <BodyText size="sm" muted>
            No revisions uploaded yet
          </BodyText>
        </div>
      )}
    </div>
  );
}
