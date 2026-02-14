import { useState } from "react";
import { X } from "lucide-react";
import { Button, Title, BodyText } from "../../../../components/ui";
import BaseModal from "../../../../components/modals/BaseModal";
import { useDocusignActions } from "../../../../../../packages/hooks/data/documents/useDocusignActions";
import { useDocusignTemplates } from "../../../../../../packages/hooks/data/documents/useDocusignTemplates";
import { useAgentClients } from "../../../../../../packages/hooks/data/agent/useAgentClients";
import { useUIStore } from "../../../../../../packages/store";
import type {
  AgreementType,
  CreateAgreementRequest,
} from "../../../../../../packages/schemas/documents/docusign";
import { getAgreementTypeLabel } from "../../../../../../packages/utils/documents/docusignHelpers";

type CreateAgreementModalProps = {
  isOpen: boolean;
  onClose: () => void;
  preselectedBuyerId?: string;
  onSuccess?: (agreementId: string) => void;
};

/**
 * CreateAgreementModal Component
 *
 * Modal for creating new DocuSign agreements (agent-only)
 * Includes form for title, type, buyer selection, property address
 */
export default function CreateAgreementModal({
  isOpen,
  onClose,
  preselectedBuyerId,
  onSuccess,
}: CreateAgreementModalProps) {
  const [title, setTitle] = useState("");
  const [agreementType, setAgreementType] = useState<AgreementType>(
    "buyer_representation",
  );
  const [selectedBuyerId, setSelectedBuyerId] = useState(
    preselectedBuyerId || "",
  );
  const [propertyAddress, setPropertyAddress] = useState("");
  const [description, setDescription] = useState("");

  const { createAgreement, isCreatingAgreement } = useDocusignActions();
  const { templates } = useDocusignTemplates();
  const { clients } = useAgentClients();
  const enqueueToast = useUIStore((s) => s.enqueueToast);

  const agreementTypes: AgreementType[] = [
    "buyer_representation",
    "offer",
    "inspection_addendum",
    "financing_contingency",
    "closing_disclosure",
    "other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      enqueueToast({
        type: "error",
        message: "Please enter an agreement title",
      });
      return;
    }

    if (!selectedBuyerId) {
      enqueueToast({
        type: "error",
        message: "Please select a buyer",
      });
      return;
    }

    try {
      const request: CreateAgreementRequest = {
        title: title.trim(),
        agreement_type: agreementType,
        buyer_id: selectedBuyerId,
        property_address: propertyAddress.trim() || undefined,
        description: description.trim() || undefined,
      };

      const agreement = await createAgreement(request);

      enqueueToast({
        type: "success",
        message: "Agreement created successfully",
      });

      // Reset form
      setTitle("");
      setAgreementType("buyer_representation");
      setSelectedBuyerId(preselectedBuyerId || "");
      setPropertyAddress("");
      setDescription("");

      if (onSuccess && agreement?.id) {
        onSuccess(agreement.id);
      }

      onClose();
    } catch (error) {
      enqueueToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to create agreement",
      });
    }
  };

  const handleClose = () => {
    if (!isCreatingAgreement) {
      onClose();
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Title size="lg">Create Agreement</Title>
          <button
            onClick={handleClose}
            disabled={isCreatingAgreement}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agreement Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Buyer Representation Agreement - John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isCreatingAgreement}
              required
            />
          </div>

          {/* Agreement Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agreement Type *
            </label>
            <select
              value={agreementType}
              onChange={(e) =>
                setAgreementType(e.target.value as AgreementType)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isCreatingAgreement}
              required
            >
              {agreementTypes.map((type) => (
                <option key={type} value={type}>
                  {getAgreementTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>

          {/* Buyer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buyer *
            </label>
            <select
              value={selectedBuyerId}
              onChange={(e) => setSelectedBuyerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isCreatingAgreement || !!preselectedBuyerId}
              required
            >
              <option value="">Select a buyer...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.email}
                </option>
              ))}
            </select>
          </div>

          {/* Property Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Address (Optional)
            </label>
            <input
              type="text"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              placeholder="e.g., 123 Main St, San Francisco, CA 94102"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isCreatingAgreement}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional details..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isCreatingAgreement}
            />
          </div>

          {/* Template Selection (if available) */}
          {templates && templates.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <BodyText size="sm" className="text-blue-900">
                💡 Tip: After creating the agreement, you can upload the
                document PDF as a revision.
              </BodyText>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleClose}
              disabled={isCreatingAgreement}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isCreatingAgreement}
            >
              {isCreatingAgreement ? "Creating..." : "Create Agreement"}
            </Button>
          </div>
        </form>
      </div>
    </BaseModal>
  );
}
