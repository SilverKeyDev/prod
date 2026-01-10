import { useState } from "react";
import { ChevronDown, User } from "lucide-react";
import { useUserData } from "../../../../packages/hooks/data/useUserData";
import { useAgentClients } from "../../../../packages/hooks/data/useAgentClients";

type ClientSelectorProps = {
  selectedClientId: string | null;
  onClientChange: (clientId: string | null) => void;
  className?: string;
};

export default function ClientSelector({
  selectedClientId,
  onClientChange,
  className = "",
}: ClientSelectorProps) {
  const { userProfile } = useUserData();
  const { clients, isLoading } = useAgentClients();
  const [isOpen, setIsOpen] = useState(false);

  const isAgent = userProfile?.is_agent ?? false;

  // Don't show if user is not an agent
  if (!isAgent) {
    return null;
  }

  const handleSelect = (clientId: string | null) => {
    onClientChange(clientId);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-olive focus:border-olive"
      >
        <User className="h-4 w-4" />
        <span>
          {selectedClientId === null
            ? "Me"
            : clients.find((c) => c.id === selectedClientId)?.name || "Select Client"}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute z-20 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="py-1">
              {/* "Me" option */}
              <button
                onClick={() => handleSelect(null)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  selectedClientId === null ? "bg-olive/10 text-olive font-medium" : "text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Me</span>
                </div>
              </button>

              {/* Divider */}
              {clients.length > 0 && (
                <div className="border-t border-gray-200 my-1" />
              )}

              {/* Client options */}
              {isLoading ? (
                <div className="px-4 py-2 text-sm text-gray-500">Loading clients...</div>
              ) : clients.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500">No clients found</div>
              ) : (
                clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleSelect(client.id)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      selectedClientId === client.id
                        ? "bg-olive/10 text-olive font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span>{client.name}</span>
                        {client.email && (
                          <span className="text-xs text-gray-500">{client.email}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
