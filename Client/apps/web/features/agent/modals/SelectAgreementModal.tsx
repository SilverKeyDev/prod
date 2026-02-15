import { useState, useMemo } from "react";
import { X, Search } from "lucide-react";
import { Title, BodyText, Button, CancelButton, CloseButton } from "../../../components/ui";
import BaseModal from "../../../components/modals/BaseModal";
import AgreementCard from "../../documents/docusign/components/AgreementCard";
import { useDocusignAgreements } from "../../../../../packages/hooks/data/documents/useDocusignAgreements";
import { KeyTurnLoader } from "../../../components/ui";
import type {
  Agreement,
  AgreementStatus,
} from "../../../../../packages/schemas/documents/docusign";

type SelectAgreementModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (agreement: Agreement) => void;
  clientId?: string;
};

/**
 * SelectAgreementModal Component
 *
 * Allows agents to select and share agreements in chat
 * Similar to SelectHomeModal, but for DocuSign agreements
 * Filters by status and search term
 */
export default function SelectAgreementModal({
  isOpen,
  onClose,
  onSelect,
  clientId,
}: SelectAgreementModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgreementStatus | "all">(
    "all",
  );

  const { agreements, isLoading, error } = useDocusignAgreements();

  // Filter agreements
  const filteredAgreements = useMemo(() => {
    let filtered = agreements;

    // Filter by client if provided
    if (clientId) {
      filtered = filtered.filter((a) => a.buyer_id === clientId);
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(term) ||
          a.property_address?.toLowerCase().includes(term) ||
          a.buyer_name?.toLowerCase().includes(term),
      );
    }

    // Sort by most recent
    return filtered.sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at).getTime();
      const dateB = new Date(b.updated_at || b.created_at).getTime();
      return dateB - dateA;
    });
  }, [agreements, clientId, statusFilter, searchTerm]);

  const handleSelect = (agreement: Agreement) => {
    onSelect(agreement);
    onClose();
    // Reset filters
    setSearchTerm("");
    setStatusFilter("all");
  };

  const statusOptions: Array<{
    value: AgreementStatus | "all";
    label: string;
  }> = [
    { value: "all", label: "All" },
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "delivered", label: "Delivered" },
    { value: "signed", label: "Signed" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <Title size="lg">Select Agreement</Title>
          <CloseButton onClick={onClose} />
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, property, or buyer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  statusFilter === option.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <KeyTurnLoader message="Loading agreements..." />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <BodyText size="sm" className="text-red-600">
                Failed to load agreements: {error}
              </BodyText>
            </div>
          ) : filteredAgreements.length === 0 ? (
            <div className="text-center py-12">
              <BodyText size="sm" muted>
                {searchTerm || statusFilter !== "all"
                  ? "No agreements match your filters"
                  : "No agreements available"}
              </BodyText>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAgreements.map((agreement) => (
                <AgreementCard
                  key={agreement.id}
                  agreement={agreement}
                  onClick={() => handleSelect(agreement)}
                  compact={true}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <CancelButton size="md" onClick={onClose}>
            Cancel
          </CancelButton>
        </div>
      </div>
    </BaseModal>
  );
}
