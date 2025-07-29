import React, { useState, useEffect } from "react";
import {
  Users,
  Download,
  Share2,
  Search,
  Eye,
  Calendar,
  Phone,
  Mail,
  User,
  FileText,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useData } from "../contexts/DataContext";

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
  agent_id: string;
  agent_name: string;
  clients: ClientData[];
  total_clients: number;
}

const ClientIntelPage: React.FC = () => {
  const { userProfile } = useData();
  const [clientData, setClientData] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState<
    "all" | "with_preferences" | "without_preferences"
  >("all");
  const [selectedClients, setSelectedClients] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const idToken = localStorage.getItem("id_token");

      const response = await fetch(
        `${apiBaseUrl}/api/v1/preferences/clients`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data: ClientIntelResponse = await response.json();

      if (data.success) {
        setClientData(data.clients);
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

  const handleSelectClient = (clientId: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map((c) => c.id)));
    }
  };

  const handleDownload = () => {
    const selectedData = clientData.filter((client) =>
      selectedClients.has(client.id)
    );
    const csvContent = generateCSV(selectedData);
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `client-intel-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const selectedData = clientData.filter((client) =>
      selectedClients.has(client.id)
    );
    const shareText = `Client Intel Report - ${
      selectedData.length
    } clients\n\n${selectedData
      .map(
        (c) =>
          `${c.name} (${c.email}) - ${
            c.has_preferences ? "Has Preferences" : "No Preferences"
          }`
      )
      .join("\n")}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Client Intel Report",
          text: shareText,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert("Client data copied to clipboard!");
    }
  };

  const generateCSV = (data: ClientData[]) => {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Created Date",
      "Has Preferences",
      "Preferences Summary",
    ];
    const rows = data.map((client) => [
      client.name,
      client.email,
      client.phone || "N/A",
      client.created_at
        ? new Date(client.created_at).toLocaleDateString()
        : "N/A",
      client.has_preferences ? "Yes" : "No",
      client.preferences
        ? Object.keys(client.preferences).length + " sections"
        : "None",
    ]);

    return [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client data...</p>
        </div>
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
      <div className="min-h-screen bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-black mb-3 sm:mb-4 flex items-center">
                  <Users className="h-8 w-8 text-gold mr-3" />
                  Client Intel
                </h1>
                <p className="mt-2 text-gray-600">
                  Manage and analyze your clients' preferences and data
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Clients
                  </p>
                  <p className="text-2xl font-bold text-black">
                    {clientData.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    With Preferences
                  </p>
                  <p className="text-2xl font-bold text-black">
                    {clientData.filter((c) => c.has_preferences).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-amber-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Needs Setup
                  </p>
                  <p className="text-2xl font-bold text-black">
                    {clientData.filter((c) => !c.has_preferences).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Selected</p>
                  <p className="text-2xl font-bold text-black">
                    {selectedClients.size}
                  </p>
                </div>
              </div>
            </div>
          </div>

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
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-gold hover:text-gold-light transition-colors font-medium"
                  >
                    {selectedClients.size === filteredClients.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={selectedClients.size === 0}
                    className="btn-primary py-1 px-2 text-xs font-bold flex items-center disabled:opacity-50 touch-manipulation select-none"
                  >
                    <Share2 className="h-3 w-3 mr-1.5" />
                    Share ({selectedClients.size})
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={selectedClients.size === 0}
                    className="btn-primary py-1 px-2 text-xs font-bold flex items-center disabled:opacity-50 touch-manipulation select-none"
                  >
                    <Download className="h-3 w-3 mr-1.5" />
                    Download ({selectedClients.size})
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-beige">
                <thead className="bg-cream/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedClients.size === filteredClients.length &&
                          filteredClients.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-beige text-gold focus:ring-gold/20"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
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
                        <input
                          type="checkbox"
                          checked={selectedClients.has(client.id)}
                          onChange={() => handleSelectClient(client.id)}
                          className="rounded border-beige text-gold focus:ring-gold/20"
                        />
                      </td>
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
                            <div className="text-sm text-gray-500">
                              ID: {client.id}
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
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-black flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          {client.created_at
                            ? formatDate(client.created_at)
                            : "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {client.has_preferences ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FileText className="h-3 w-3 mr-1" />
                            Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Needs Setup
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-gold hover:text-gold-light flex items-center transition-colors font-medium">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
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
    </>
  );
};

export default ClientIntelPage;
