import { Download, FileText } from "lucide-react";
import { Button, BodyText } from "../../../../components/ui";
import RevisionUpload from "./RevisionUpload";
import { formatAgreementDateTime } from "../../../../../../packages/utils/documents/docusignHelpers";
import type { AgreementRevision } from "../../../../../../packages/schemas/documents/docusign";

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
            <Button
              variant="primary"
              size="md"
              onClick={onUploadClick}
            >
              Upload Revision
            </Button>
          ) : (
            <div className="p-4 border border-gray-200 rounded-lg">
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
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {revision.file_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Revision #{revision.revision_number} •{" "}
                      {(revision.file_size / 1024).toFixed(1)} KB •{" "}
                      {formatAgreementDateTime(revision.created_at)}
                    </p>
                    {revision.notes && (
                      <p className="text-sm text-gray-600 mt-1">
                        {revision.notes}
                      </p>
                    )}
                    {revision.created_by_name && (
                      <p className="text-xs text-gray-500 mt-1">
                        By {revision.created_by_name}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDownloadClick(revision.id)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <BodyText size="sm" muted>
            No revisions uploaded yet
          </BodyText>
        </div>
      )}
    </div>
  );
}
