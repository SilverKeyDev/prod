import React, { useState, useEffect } from "react";
import {
  Users,
  Download,
  Search,
  Eye,
  Phone,
  Mail,
  User,
  AlertCircle,
  X,
  Check,
  Target,
} from "lucide-react";

import Loading from "../../components/Loading";
import PageHeader from "../../components/PageHeader";

// Custom scrollbar styles matching CompareReportsPage
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
    margin-left: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 3px;
    margin-left: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #E8D5B560; /* Lighter brown with 60% opacity */
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #E8D5B580; /* Slightly darker on hover with 80% opacity */
  }
  .custom-scrollbar {
    padding-right: 8px;
  }
`;

interface ClientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  has_preferences: boolean;
  preferences: any;
}

interface ClientIntelResponse {
  success: boolean;
  preferences: any[];
  user_information: any[];
}

const ClientIntelPage: React.FC = () => {
  const [clientData, setClientData] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy] = useState<
    "all" | "with_preferences" | "without_preferences"
  >("all");
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showActionPlanModal, setShowActionPlanModal] = useState(false);
  const [actionPlanData, setActionPlanData] = useState<{
    client_name: string;
    action_plan: string;
    generated_at: string;
  } | null>(null);
  const [actionPlanLoading, setActionPlanLoading] = useState(false);

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const idToken = localStorage.getItem("id_token");

      const response = await fetch(`${apiBaseUrl}/api/v1/preferences/clients`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
      });

      const data: ClientIntelResponse = await response.json();

      if (data.success) {
        // Combine user information with preferences data
        const combinedData: ClientData[] = data.user_information.map(
          (user: any, index: number) => {
            const preferences = data.preferences[index] || null;
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              created_at: user.created_at,
              has_preferences: preferences !== null,
              preferences: preferences,
            };
          }
        );
        setClientData(combinedData);
      }
    } catch (err) {
      setError("Network error occurred");
      console.error("Error fetching client data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clientData.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterBy === "all" ||
      (filterBy === "with_preferences" && client.has_preferences) ||
      (filterBy === "without_preferences" && !client.has_preferences);

    return matchesSearch && matchesFilter;
  });

  // Handler function for viewing details
  const handleViewDetails = (client: ClientData) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  // Handler function for action plan
  const handleActionPlan = async (client: ClientData) => {
    if (!client.has_preferences) {
      alert(
        `${client.name} needs to complete their preferences setup before generating an action plan.`
      );
      return;
    }

    setActionPlanLoading(true);
    setActionPlanData(null);
    setShowActionPlanModal(true);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const idToken = localStorage.getItem("id_token");

      const response = await fetch(
        `${apiBaseUrl}/api/v1/preferences/action-plan/${client.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setActionPlanData({
          client_name: data.client_name,
          action_plan: data.action_plan,
          generated_at: data.generated_at,
        });
      } else {
        console.error("Failed to generate action plan:", data.error);
        alert(`Failed to generate action plan: ${data.error}`);
        setShowActionPlanModal(false);
      }
    } catch (error) {
      console.error("Error generating action plan:", error);
      alert(
        "Network error occurred while generating action plan. Please try again."
      );
      setShowActionPlanModal(false);
    } finally {
      setActionPlanLoading(false);
    }
  };

  const downloadActionPlan = () => {
    if (!actionPlanData) return;

    const content =
      `ACTION PLAN - ${actionPlanData.client_name}\n` +
      `Generated on: ${new Date(
        actionPlanData.generated_at
      ).toLocaleDateString()} at ${new Date(
        actionPlanData.generated_at
      ).toLocaleTimeString()}\n` +
      `\n${"=".repeat(60)}\n\n` +
      actionPlanData.action_plan;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `action-plan-${actionPlanData.client_name
      .replace(/\s+/g, "-")
      .toLowerCase()}-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export user preferences to CSV
  const exportPreferencesToCSV = () => {
    if (!selectedClient || !selectedClient.preferences) {
      return;
    }

    const preferences = selectedClient.preferences;
    const rows: string[][] = [];

    // Add header
    rows.push(["Section", "Field", "Value"]);

    // Process each section
    Object.entries(preferences).forEach(([sectionKey, sectionData]) => {
      if (
        sectionData &&
        typeof sectionData === "object" &&
        !Array.isArray(sectionData)
      ) {
        Object.entries(sectionData).forEach(([fieldKey, fieldValue]) => {
          if (
            fieldValue !== null &&
            fieldValue !== undefined &&
            fieldValue !== ""
          ) {
            const sectionName = sectionKey
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase());
            const fieldName = fieldKey
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase());

            let value = "";
            if (Array.isArray(fieldValue)) {
              value =
                fieldValue.length > 0 ? fieldValue.join(", ") : "Not specified";
            } else if (typeof fieldValue === "object") {
              value = JSON.stringify(fieldValue);
            } else if (typeof fieldValue === "boolean") {
              value = fieldValue ? "Yes" : "No";
            } else {
              // Apply the same formatting logic as the table
              const rangeFields = [
                "savings_amount_range",
                "income_range",
                "preferred_home_price_range",
              ];
              if (rangeFields.includes(fieldKey)) {
                value = String(fieldValue).replace(/_/g, "-");
              } else {
                value = String(fieldValue).replace(/_/g, " ");
              }
            }

            rows.push([sectionName, fieldName, value]);
          }
        });
      }
    });

    // Convert to CSV
    const csvContent = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${selectedClient.name.replace(/\s+/g, "_")}_preferences.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loading message="Loading client data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-black mb-2">
            Error Loading Client Data
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchClientData} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="min-h-screen bg-off-white">
        <PageHeader
          title="Client Intel"
          subtitle="Manage and analyze your clients' preferences and data"
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Filters and Search */}
          <div className="card mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search clients by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mobile-input pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Client Table */}
          <div className="card overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-beige bg-cream/30">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-black">
                  Client List ({filteredClients.length})
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-beige">
                <thead className="bg-cream/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preferences
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-beige">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-cream/30 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-cream flex items-center justify-center border border-beige">
                              <User className="h-5 w-5 text-gold" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-black">
                              {client.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              Joined:{" "}
                              {new Date(client.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-black flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="truncate max-w-xs">
                            {client.email}
                          </span>
                        </div>
                        {client.phone && (
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                            {client.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        {client.has_preferences ? (
                          <button
                            onClick={() => handleViewDetails(client)}
                            className="text-gold hover:text-gold-light flex items-center transition-colors font-medium"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Needs Setup
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleActionPlan(client)}
                          className="text-olive hover:text-olive-light flex items-center transition-colors font-medium"
                        >
                          <Target className="h-4 w-4 mr-1" />
                          Action Plan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-black mb-2">
                  No clients found
                </h3>
                <p className="text-gray-600">
                  {searchTerm || filterBy !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "No clients are currently assigned to your account."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Preferences Modal */}
      {showModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-cream/30">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-black">
                    User Preferences - {selectedClient.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedClient.email}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedClient.preferences && (
                    <>
                      <button
                        onClick={exportPreferencesToCSV}
                        className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-olive hover:bg-olive-light rounded-lg transition-colors touch-friendly"
                      >
                        <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Export CSV</span>
                        <span className="sm:hidden">CSV</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] custom-scrollbar">
              {selectedClient.preferences ? (
                <UserPreferencesTable
                  preferences={selectedClient.preferences}
                />
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-black mb-2">
                    No Preferences Found
                  </h3>
                  <p className="text-gray-600">
                    This user hasn't completed their preference setup yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Plan Modal */}
      {showActionPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-cream/30">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-black flex items-center">
                    <Target className="h-6 w-6 text-olive mr-3" />
                    Action Plan
                    {actionPlanData && (
                      <span className="text-base font-normal text-gray-600 ml-2">
                        - {actionPlanData.client_name}
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    AI-generated personalized action plan based on client
                    preferences
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {actionPlanData && (
                    <button
                      onClick={downloadActionPlan}
                      className="flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-olive hover:bg-olive-light rounded-lg transition-colors touch-friendly"
                    >
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Download</span>
                      <span className="sm:hidden">DL</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowActionPlanModal(false);
                      setActionPlanData(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] custom-scrollbar">
              {actionPlanLoading ? (
                <div className="text-center py-12">
                  <Loading message="Generating action plan..." />
                </div>
              ) : actionPlanData ? (
                <div className="space-y-6">
                  {/* Action Plan Content */}
                  <div className="prose max-w-none">
                    <div
                      className="text-gray-800 leading-relaxed whitespace-pre-wrap"
                      style={{
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        lineHeight: "1.6",
                      }}
                    >
                      {actionPlanData.action_plan}
                    </div>
                  </div>

                  {/* Footer with generation info */}
                  <div className="border-t border-gray-200 pt-4 mt-6">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        Generated successfully
                      </div>
                      <div>
                        {actionPlanData.generated_at && (
                          <span>
                            Generated on{" "}
                            {new Date(
                              actionPlanData.generated_at
                            ).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(
                              actionPlanData.generated_at
                            ).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-black mb-2">
                    Failed to Generate Action Plan
                  </h3>
                  <p className="text-gray-600">
                    There was an error generating the action plan. Please try
                    again.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// User Preferences Table Component
interface UserPreferencesTableProps {
  preferences: any;
}

const UserPreferencesTable: React.FC<UserPreferencesTableProps> = ({
  preferences,
}) => {
  // Debug logging for preferences data
  console.log("[DEBUG] Full preferences object:", preferences);
  console.log("[DEBUG] Preferences keys:", Object.keys(preferences || {}));
  console.log(
    "[DEBUG] Report customization data:",
    preferences?.report_section_priorities
  );
  const formatValue = (value: any, fieldKey?: string): string => {
    if (value === null || value === undefined) {
      return "Not specified";
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return "Not specified";
      }

      // Check if it's an array of location objects with name and address
      if (
        value[0] &&
        typeof value[0] === "object" &&
        (value[0].name || value[0].address)
      ) {
        return value
          .map((item: any) => {
            if (item.name && item.address) {
              return `${item.name} (${item.address})`;
            } else if (item.name) {
              return item.name;
            } else if (item.address) {
              return item.address;
            }
            return JSON.stringify(item);
          })
          .join(", ");
      }

      // Regular array handling
      return value.join(", ");
    }

    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    const stringValue = String(value);

    // Special handling for range fields - use hyphens instead of spaces
    const rangeFields = [
      "savings_amount_range",
      "income_range",
      "preferred_home_price_range",
    ];
    if (fieldKey && rangeFields.includes(fieldKey)) {
      return stringValue.replace(/_/g, "-");
    }

    // For all other fields, replace underscores with spaces and capitalize each word
    return stringValue
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatFieldName = (key: string): string => {
    return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Define the report section priority order
  const VALID_REPORT_SECTIONS = [
    "neighborhood_overview",
    "safety",
    "culture_and_events",
    "social_character",
    "local_amenities",
    "commute",
    "family_friendly",
    "nightlife_and_dating",
    "development",
    "environment_utilities",
    "financial_information",
    "schools",
    "extra_tips",
  ];

  const renderSection = (title: string, data: any) => {
    // Add debugging for Report Customization section
    if (title === "Report Customization") {
      console.log("[DEBUG] Report Customization data:", data);
      console.log("[DEBUG] Data type:", typeof data);
      console.log("[DEBUG] Data keys:", data ? Object.keys(data) : "No data");
    }

    if (!data || typeof data !== "object") {
      if (title === "Report Customization") {
        console.log("[DEBUG] Report Customization: No data or not an object");
      }
      return null;
    }

    const entries = Object.entries(data).filter(
      ([_, value]) => value !== null && value !== undefined && value !== ""
    );

    if (title === "Report Customization") {
      console.log("[DEBUG] Report Customization entries:", entries);
      console.log("[DEBUG] Entries length:", entries.length);
    }

    if (entries.length === 0) {
      if (title === "Report Customization") {
        console.log("[DEBUG] Report Customization: No entries found");
      }
      return null;
    }

    // Special handling for Report Customization section
    const isReportCustomization = title === "Report Customization";

    // Sort entries for report customization based on priority order
    const sortedEntries = isReportCustomization
      ? entries.sort(([keyA], [keyB]) => {
          const sectionKeyA = keyA.replace(/^include_/, "");
          const sectionKeyB = keyB.replace(/^include_/, "");
          const indexA = VALID_REPORT_SECTIONS.indexOf(sectionKeyA);
          const indexB = VALID_REPORT_SECTIONS.indexOf(sectionKeyB);

          // Priority sections come first, ordered by their index (1, 2, 3, etc.)
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }
          // Priority sections come before non-priority sections
          if (indexA !== -1 && indexB === -1) return -1;
          if (indexA === -1 && indexB !== -1) return 1;
          // Non-priority sections are sorted alphabetically at the bottom
          return sectionKeyA.localeCompare(sectionKeyB);
        })
      : entries;

    // Special styling for Report Customization section
    if (isReportCustomization) {
      console.log("[DEBUG] Processing Report Customization section");

      // Handle the actual data structure: {report_section_priorities: [array of sections]}
      const prioritizedSections = data.report_section_priorities || [];
      console.log("[DEBUG] Prioritized sections:", prioritizedSections);

      // Determine which sections are enabled (in the priorities) vs disabled (not in priorities)
      const enabledSections = prioritizedSections.map(
        (sectionKey: string, index: number) => {
          const name = sectionKey
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          const displayName = `${index + 1}. ${name}`;
          return { key: sectionKey, displayName };
        }
      );

      // Find disabled sections (sections in VALID_REPORT_SECTIONS but not in priorities)
      const disabledSections = VALID_REPORT_SECTIONS.filter(
        (section) => !prioritizedSections.includes(section)
      ).map((sectionKey) => {
        const name = sectionKey
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        const displayName = name; // No numbering for disabled sections
        return { key: sectionKey, displayName };
      });

      console.log("[DEBUG] Enabled sections:", enabledSections);
      console.log("[DEBUG] Disabled sections:", disabledSections);

      return (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-black mb-4 pb-2 border-b border-gray-200">
            {title}
          </h3>

          {/* Enabled Sections */}
          {enabledSections.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-olive mb-3 flex items-center gap-2">
                <Check className="w-4 h-4" />
                Enabled Sections ({enabledSections.length})
              </h4>
              <div className="border-2 border-olive rounded-lg p-4 bg-green-100">
                <div className="space-y-2">
                  {enabledSections.map(
                    ({
                      key,
                      displayName,
                    }: {
                      key: string;
                      displayName: string;
                    }) => (
                      <div
                        key={key}
                        className="flex items-center text-sm text-black"
                      >
                        <span className="font-medium">{displayName}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Disabled Sections */}
          {disabledSections.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-600 mb-3 flex items-center gap-2">
                <X className="w-4 h-4" />
                Disabled Sections ({disabledSections.length})
              </h4>
              <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="space-y-2">
                  {disabledSections.map(
                    ({
                      key,
                      displayName,
                    }: {
                      key: string;
                      displayName: string;
                    }) => (
                      <div
                        key={key}
                        className="flex items-center text-sm text-gray-500"
                      >
                        <span className="font-medium">{displayName}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Default table rendering for other sections
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-black mb-4 pb-2 border-b border-gray-200">
          {title}
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <tbody className="divide-y divide-gray-100">
              {sortedEntries.map(([key, value]) => {
                const displayName = formatFieldName(key);

                return (
                  <tr key={key} className="hover:bg-gray-50">
                    <td className="py-3 pr-6 text-sm font-medium text-gray-700 w-1/3">
                      {displayName}
                    </td>
                    <td className="py-3 text-sm text-gray-900">
                      <div className="max-w-md break-words">
                        {formatValue(value, key)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Organize preferences into logical sections based on the new flat structure
  const demographicsData = {
    age: preferences.age,
    gender: preferences.gender,
    occupation: preferences.occupation,
    pets: preferences.pets,
  };

  const financialData = {
    gross_income: preferences.gross_income,
    home_budget: preferences.home_budget,
    credit_score_range: preferences.credit_score_range,
    down_payment: preferences.down_payment,
    ideal_zip_code: preferences.ideal_zip_code,
  };

  const housingData = {
    preferred_housing_type: preferences.preferred_housing_type,
    preferred_bathrooms: preferences.preferred_bathrooms,
    preferred_bedrooms: preferences.preferred_bedrooms,
    preferred_lot_size: preferences.preferred_lot_size,
    preferred_home_age: preferences.preferred_home_age,
    preferred_architectural_style: preferences.preferred_architectural_style,
    renovation_preference: preferences.renovation_preference,
    intended_property_use: preferences.intended_property_use,
    preferred_home_features: preferences.preferred_home_features,
    deal_breakers: preferences.deal_breakers,
  };

  const locationData = {
    important_locations: preferences.important_locations,
    commute_tolerance: preferences.commute_tolerance,
    walkability_importance: preferences.walkability_importance,
  };

  const communicationData = {
    communication_frequency: preferences.communication_frequency,
    information_detail_level: preferences.information_detail_level,
    has_buyers_agent: preferences.has_buyers_agent,
    looking_for_buyers_agent: preferences.looking_for_buyers_agent,
  };

  const reportCustomizationData = {
    report_section_priorities: preferences.report_section_priorities,
  };

  return (
    <div className="space-y-6">
      {renderSection("Demographics", demographicsData)}
      {renderSection("Financial Profile", financialData)}
      {renderSection("Housing Preferences", housingData)}
      {renderSection("Location Preferences", locationData)}
      {renderSection("Communication Preferences", communicationData)}
      {renderSection("Report Customization", reportCustomizationData)}
    </div>
  );
};

export default ClientIntelPage;
