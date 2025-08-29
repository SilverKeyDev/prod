import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Search, UserPlus } from "lucide-react";
import { usePreferences, useUser, useAgent, Agent } from "../../context";
import PageHeader from "../../components/ui/base/PageHeader";

export default function AgentConnection() {
  const { refreshUserPreferences } = usePreferences();
  const { userProfile } = useUser();
  const {
    assignedAgent,
    agentSearchResults: agents,
    searchLoading: agentSearchLoading,
    searchAgents,
    assignAgent,
    removeAgent
  } = useAgent();

  const [agentSearchTerm, setAgentSearchTerm] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [agentToRemove, setAgentToRemove] = useState<Agent | null>(null);
  const [openDropdowns, setOpenDropdowns] = useState<{[key: string]: boolean}>({});

  const assignedAgents = assignedAgent ? [assignedAgent] : [];

  // Handle agent search with debouncing
  useEffect(() => {
    if (agentSearchTerm.trim()) {
      const timeoutId = setTimeout(() => {
        searchAgents(agentSearchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [agentSearchTerm, searchAgents]);

  const handleAgentSearch = (value: string) => {
    setAgentSearchTerm(value);
  };

  const handleAssignAgent = async (agent: Agent) => {
    try {
      await assignAgent(agent.id);
      setAgentSearchTerm("");
      setShowSuccessDialog(true);
      refreshUserPreferences();
    } catch (error) {
      console.error("Error assigning agent:", error);
    }
  };

  const handleRemoveAgentClick = (agent: Agent) => {
    setAgentToRemove(agent);
    setShowConfirmModal(true);
  };

  const confirmRemoveAgent = async () => {
    if (!agentToRemove) return;

    try {
      await removeAgent();
      refreshUserPreferences();
    } catch (error) {
      console.error("Error removing agent:", error);
    } finally {
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
  }, [refreshUserPreferences]);

  return (
    <div className="min-h-screen bg-off-white">
      <PageHeader
        title="Agent Connection"
        subtitle="Connect with real estate agents and manage your professional relationships"
      />
      
      <div className="max-w-7xl mx-auto px-responsive-sm sm:px-responsive-md lg:px-responsive-lg py-responsive-lg">

        {/* Agent Search Section */}
        {userProfile && !userProfile.is_agent && (
          <div className="mb-8">
            <div className="mobile-card">
              <h3 className="text-responsive-md font-medium text-black space-y-responsive-sm">
                Find Your Agent
              </h3>

              {/* Search Input */}
              <div className="space-y-responsive-sm">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="mobile-icon-xs text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={agentSearchTerm}
                    onChange={(e) => handleAgentSearch(e.target.value)}
                    placeholder="Search agents by name or email..."
                    className="mobile-input pl-10 hover:border-brown focus:border-brown focus:ring-brown/20"
                  />
                </div>

                {/* Search Results */}
                {agentSearchLoading && (
                  <div className="text-responsive-sm text-gray-500 flex items-center">
                    <div className="animate-spin rounded-full mobile-icon-xs border-b-2 border-brown mr-2"></div>
                    Searching agents...
                  </div>
                )}

                {agents.length > 0 && (
                  <div className="space-y-responsive-xs max-h-60 overflow-y-auto">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between space-responsive-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <h4 className="font-medium text-black">
                            {agent.name}
                          </h4>
                          <p className="text-responsive-sm text-gray-600">{agent.email}</p>
                          {agent.phone && (
                            <p className="text-responsive-sm text-gray-600">
                              {agent.phone}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleAssignAgent(agent)}
                          className="flex items-center px-responsive-sm py-responsive-xs bg-brown text-white rounded-md hover:bg-brown/80 transition-colors text-responsive-sm touch-friendly"
                        >
                          <UserPlus className="mobile-icon-xs mr-1" />
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {agentSearchTerm &&
                  !agentSearchLoading &&
                  agents.length === 0 && (
                    <div className="text-responsive-sm text-gray-500 text-center py-responsive-sm">
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
              <div className="space-y-responsive-sm">
                {assignedAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-olive/5 border border-olive/20 rounded-lg space-responsive-sm hover:bg-olive/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-black space-y-responsive-xs">
                          {agent.name}
                        </h4>
                        <p className="text-responsive-sm text-gray-600 space-y-responsive-xs">
                          {agent.email}
                        </p>
                        {agent.phone && (
                          <p className="text-sm text-gray-600">
                            📞 {agent.phone}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveAgentClick(agent)}
                        className="space-responsive-xs text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors touch-friendly"
                        title="Remove agent"
                      >
                        <X className="mobile-icon-xs" />
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
          <div className="card text-center py-responsive-xl">
            <UserPlus className="mobile-icon-xl text-gray-400 mx-auto space-y-responsive-sm" />
            <h3 className="text-responsive-md font-medium text-black space-y-responsive-xs">
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
              <p className="text-gray-600 space-y-responsive-sm">
                As an agent, you can view and manage your client connections here.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg space-responsive-sm">
                <p className="text-responsive-sm text-blue-800">
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
                className="relative z-[10000] w-full max-w-sm mx-auto transform overflow-hidden rounded-2xl bg-white space-responsive-md text-left shadow-xl transition-all"
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
                    <h3 className="text-responsive-md font-medium leading-6 text-gray-900">
                      Success!
                    </h3>
                    <div className="mt-2">
                      <p className="text-responsive-sm text-gray-500">
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
