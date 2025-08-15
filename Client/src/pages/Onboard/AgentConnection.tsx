import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Search, UserPlus } from "lucide-react";
import { useData } from "../../contexts/DataContext";
import PageHeader from "../../components/PageHeader";

interface Agent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at?: string;
}

export default function AgentConnection() {
  const { refreshUserPreferences, userProfile } = useData();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<{
    [key: string]: boolean;
  }>({});

  // Agent search state
  const [agentSearchTerm, setAgentSearchTerm] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentSearchLoading, setAgentSearchLoading] = useState(false);
  const [assignedAgents, setAssignedAgents] = useState<Agent[]>([]);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [agentToRemove, setAgentToRemove] = useState<Agent | null>(null);

  // Fetch user's assigned agents
  const fetchUserAgents = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const idToken = localStorage.getItem("id_token");

      const response = await fetch(
        `${apiBaseUrl}/api/v1/preferences/users_agents`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setAssignedAgents(data.agents || []);
        console.log(
          "✅ Successfully loaded user agents:",
          data.agents?.length || 0
        );
      } else {
        console.error("❌ Failed to fetch user agents:", data.error);
      }
    } catch (error) {
      console.error("💥 Error fetching user agents:", error);
    }
  };

  // Agent search functions
  const searchAgents = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setAgents([]);
      return;
    }

    try {
      setAgentSearchLoading(true);
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const idToken = localStorage.getItem("id_token");

      const response = await fetch(
        `${apiBaseUrl}/api/v1/preferences/agents?search=${encodeURIComponent(
          searchTerm
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        // Filter out all assigned agents from search results
        const assignedAgentIds = assignedAgents.map((agent) => agent.id);
        const filteredAgents = (data.agents || []).filter((agent: Agent) => {
          return !assignedAgentIds.includes(agent.id);
        });
        setAgents(filteredAgents);
      } else {
        console.error("Failed to search agents:", data.error);
        setAgents([]);
      }
    } catch (error) {
      console.error("Error searching agents:", error);
      setAgents([]);
    } finally {
      setAgentSearchLoading(false);
    }
  };

  const handleAgentSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAgentSearchTerm(value);

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchAgents(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const assignAgent = async (agent: Agent) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const idToken = localStorage.getItem("id_token");

      const response = await fetch(
        `${apiBaseUrl}/api/v1/preferences/add?agent_id=${encodeURIComponent(
          agent.id
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setAssignedAgents((prev) => [...prev, agent]);
        setAgentSearchTerm("");
        setAgents([]);
        console.log("✅ Successfully assigned agent:", data.message);
      } else {
        console.error("❌ Failed to assign agent:", data.error);
      }
    } catch (error) {
      console.error("💥 Error assigning agent:", error);
    }
  };

  const removeAgent = (agent: Agent) => {
    // Show custom confirmation modal
    setAgentToRemove(agent);
    setShowConfirmModal(true);
  };

  const confirmRemoveAgent = async () => {
    if (!agentToRemove) return;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const idToken = localStorage.getItem("id_token");

      const response = await fetch(
        `${apiBaseUrl}/api/v1/preferences/remove?agent_id=${encodeURIComponent(
          agentToRemove.id
        )}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        // Remove agent from frontend state
        setAssignedAgents((prev) =>
          prev.filter((agent) => agent.id !== agentToRemove.id)
        );
        console.log("✅ Successfully removed agent:", agentToRemove.name);
      } else {
        console.error("❌ Failed to remove agent:", data.error);
      }
    } catch (error) {
      console.error("💥 Error removing agent:", error);
    } finally {
      // Close modal and reset state
      setShowConfirmModal(false);
      setAgentToRemove(null);
    }
  };

  const cancelRemoveAgent = () => {
    setShowConfirmModal(false);
    setAgentToRemove(null);
  };

  // Refs for dropdown management
  const dropdownRefs = useRef<{
    [key: string]: React.RefObject<HTMLDivElement>;
  }>({});

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      let shouldClose = true;

      Object.entries(dropdownRefs.current).forEach(([_fieldName, ref]) => {
        if (ref.current && ref.current.contains(target)) {
          shouldClose = false;
        }
      });

      if (
        shouldClose &&
        Object.keys(openDropdowns).some((key) => openDropdowns[key])
      ) {
        setOpenDropdowns({});
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openDropdowns]);

  // Refresh data when page loads to ensure latest updates
  useEffect(() => {
    refreshUserPreferences();
    fetchUserAgents();
  }, [refreshUserPreferences]);

  return (
    <div className="min-h-screen bg-off-white">
      <PageHeader
        title="Agent Connection"
        subtitle="Connect with real estate agents and manage your professional relationships"
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Agent Search Section */}
        {userProfile && !userProfile.is_agent && (
          <div className="mb-8">
            <div className="mobile-card">
              <h3 className="text-lg font-medium text-black mb-4">
                Find Your Agent
              </h3>

              {/* Search Input */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={agentSearchTerm}
                    onChange={handleAgentSearch}
                    placeholder="Search agents by name or email..."
                    className="mobile-input pl-10 hover:border-brown focus:border-brown focus:ring-brown/20"
                  />
                </div>

                {/* Search Results */}
                {agentSearchLoading && (
                  <div className="text-sm text-gray-500 flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brown mr-2"></div>
                    Searching agents...
                  </div>
                )}

                {agents.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <h4 className="font-medium text-black">
                            {agent.name}
                          </h4>
                          <p className="text-sm text-gray-600">{agent.email}</p>
                          {agent.phone && (
                            <p className="text-sm text-gray-600">
                              {agent.phone}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => assignAgent(agent)}
                          className="flex items-center px-3 py-1 bg-brown text-white rounded-md hover:bg-brown/80 transition-colors text-sm"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {agentSearchTerm &&
                  !agentSearchLoading &&
                  agents.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No agents found matching "{agentSearchTerm}"
                    </div>
                  )}

              </div>
            </div>
          </div>
        )}

        {/* Assigned Agents Section */}
        {userProfile && !userProfile.is_agent && assignedAgents.length > 0 && (
          <div className="mb-8">
            <div className="card">
              <h3 className="text-lg font-medium text-black mb-4 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-olive" />
                Your Agents ({assignedAgents.length})
              </h3>
              <div className="space-y-3">
                {assignedAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-olive/5 border border-olive/20 rounded-lg p-4 hover:bg-olive/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-black mb-1">
                          {agent.name}
                        </h4>
                        <p className="text-sm text-gray-600 mb-1">
                          {agent.email}
                        </p>
                        {agent.phone && (
                          <p className="text-sm text-gray-600">
                            📞 {agent.phone}
                          </p>
                        )}
                        {agent.created_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            Connected: {new Date(agent.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeAgent(agent)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Remove agent"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty State for Non-Agents */}
        {userProfile && !userProfile.is_agent && assignedAgents.length === 0 && (
          <div className="card text-center py-12">
            <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">
              No Agents Connected
            </h3>
            <p className="text-gray-600 mb-4">
              Search for agents above to connect with real estate professionals who can help you find your perfect home.
            </p>
          </div>
        )}

        {/* Agent View - Show Client List */}
        {userProfile && userProfile.is_agent && (
          <div className="mb-8">
            <div className="card">
              <h3 className="text-lg font-medium text-black mb-4 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-olive" />
                Your Clients
              </h3>
              <p className="text-gray-600 mb-4">
                As an agent, you can view and manage your client connections here.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Your clients can find and connect with you by searching for your name or email address.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Dialog */}
      {showSuccessDialog &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] overflow-y-auto"
            style={{ left: 0, right: 0, top: 0, bottom: 0 }}
          >
            <div
              className="flex min-h-screen items-center justify-center p-4 sm:p-6"
              style={{ width: "100vw", height: "100vh" }}
            >
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={() => setShowSuccessDialog(false)}
                style={{ left: 0, right: 0, top: 0, bottom: 0 }}
              />

              {/* Dialog */}
              <div
                className="relative z-[10000] w-full max-w-sm mx-auto transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all"
                style={{ maxWidth: "320px" }}
              >
                {/* Close button */}
                <button
                  type="button"
                  onClick={() => setShowSuccessDialog(false)}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-500 touch-friendly"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>

                {/* Content */}
                <div className="flex items-start justify-center">
                  <div className="mt-3 text-center w-full">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Success!
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Preferences updated successfully!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action */}
                <div className="mt-5 sm:mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowSuccessDialog(false)}
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-gold px-6 py-2 text-sm font-medium text-black shadow-sm hover:bg-gold/90 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 sm:w-auto touch-friendly min-w-[100px]"
                  >
                    Okay
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Agent Removal Confirmation Modal */}
      {showConfirmModal &&
        agentToRemove &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] overflow-y-auto"
            style={{ left: 0, right: 0, top: 0, bottom: 0 }}
          >
            <div
              className="flex min-h-screen items-center justify-center p-4 sm:p-6"
              style={{ width: "100vw", height: "100vh" }}
            >
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={cancelRemoveAgent}
                style={{ left: 0, right: 0, top: 0, bottom: 0 }}
              />

              {/* Dialog */}
              <div
                className="relative z-[10000] w-full max-w-md mx-auto transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all"
                style={{ maxWidth: "400px" }}
              >
                {/* Close button */}
                <button
                  type="button"
                  onClick={cancelRemoveAgent}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-500 touch-friendly"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>

                {/* Content */}
                <div className="text-center">
                  {/* Warning Icon */}
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                    <svg
                      className="h-6 w-6 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Remove Agent
                  </h3>

                  {/* Message */}
                  <p className="text-sm text-gray-600 mb-6">
                    Are you sure you want to remove{" "}
                    <span className="font-medium text-gray-900">
                      {agentToRemove.name}
                    </span>{" "}
                    as your agent?
                    <br />
                    <br />
                    This will remove them from your agent list and you from
                    their client list.
                  </p>

                  {/* Buttons */}
                  <div className="flex gap-3 justify-center">
                    <button
                      type="button"
                      onClick={cancelRemoveAgent}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brown transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmRemoveAgent}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                      Remove Agent
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
