import { useState, useEffect } from "react";
import FavoriteHomesDropdown from "../../components/FavoriteHomesDropdown";
import Loading from "../../components/Loading";
import PageHeader from "../../components/PageHeader";
import {
  Home,
  Download,
  Share2,
  Lightbulb,
} from "lucide-react";

const sectionBox =
  "bg-white rounded-xl shadow-sm p-6 mb-6 border border-beige/40";
const sectionTitle =
  "text-lg font-semibold text-navy flex items-center gap-3 mb-4";
const label = "block text-navy font-medium mb-2";
const button =
  "bg-olive text-white px-6 py-3 rounded-lg font-semibold hover:bg-olive-light transition-colors duration-200 flex items-center gap-2";

export default function NegotiationStrategy() {
  const [selectedHome, setSelectedHome] = useState<any>(null);
  const [strategyData, setStrategyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedStrategy = localStorage.getItem('negotiationStrategy');
    const savedHome = localStorage.getItem('negotiationSelectedHome');
    
    if (savedStrategy) {
      try {
        setStrategyData(JSON.parse(savedStrategy));
      } catch (error) {
        console.error('Failed to parse saved strategy data:', error);
        localStorage.removeItem('negotiationStrategy');
      }
    }
    
    if (savedHome) {
      try {
        setSelectedHome(JSON.parse(savedHome));
      } catch (error) {
        console.error('Failed to parse saved home data:', error);
        localStorage.removeItem('negotiationSelectedHome');
      }
    }
  }, []);

  const handleGenerate = async () => {
    if (!selectedHome) return;
    
    setIsLoading(true);
    setError(null);
    setStrategyData(null);

    try {
      // Get authentication token
      const idToken = localStorage.getItem('id_token');
      if (!idToken) {
        throw new Error('Authentication required. Please log in.');
      }
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

      const res = await fetch(`${baseUrl}/api/v1/offer/generate-strategy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          address: selectedHome.address || selectedHome.full_address || selectedHome.location,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP error! status: ${res.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate strategy');
      }

      // Parse the strategy data from the AI response
      const strategyData = data.strategy;
      
      // Debug: Log the actual response structure
      console.log('Full API response:', data);
      console.log('Strategy data structure:', strategyData);
      console.log('Strategy data keys:', Object.keys(strategyData || {}));
      
      // Store the complete strategy data from the AI response
      // This will display ALL fields returned by the AI
      setStrategyData(strategyData || {});
      
      // Save both strategy data and selected home to localStorage
      localStorage.setItem('negotiationStrategy', JSON.stringify(strategyData || {}));
      localStorage.setItem('negotiationSelectedHome', JSON.stringify(selectedHome));

    } catch (err) {
      console.error('Error generating negotiation strategy:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate strategy. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle home selection from dropdown
  const handleHomeSelection = (home: any) => {
    setSelectedHome(home);
    setStrategyData(null); // Reset strategy when home changes
    
    // Save the newly selected home to localStorage
    localStorage.setItem('negotiationSelectedHome', JSON.stringify(home));
    
    // Clear saved strategy since we're selecting a different home
    localStorage.removeItem('negotiationStrategy');
  };

  // Handle JSON download
  const handleDownloadJson = () => {
    if (!strategyData) return;
    
    const dataStr = JSON.stringify(strategyData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `negotiation-strategy-${selectedHome?.address?.replace(/[^a-zA-Z0-9]/g, '-') || 'strategy'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle JSON sharing
  const handleShareJson = async () => {
    if (!strategyData) return;
    
    const dataStr = JSON.stringify(strategyData, null, 2);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Negotiation Strategy',
          text: `Negotiation strategy for ${selectedHome?.address || 'property'}`,
          files: [new File([dataStr], 'negotiation-strategy.json', { type: 'application/json' })]
        });
      } catch (err) {
        console.log('Share cancelled or failed:', err);
        // Fallback to clipboard
        handleCopyToClipboard(dataStr);
      }
    } else {
      // Fallback for browsers without Web Share API
      handleCopyToClipboard(dataStr);
    }
  };

  // Fallback function to copy JSON to clipboard
  const handleCopyToClipboard = async (dataStr: string) => {
    try {
      await navigator.clipboard.writeText(dataStr);
      alert('Strategy JSON copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to share. Please try downloading instead.');
    }
  };

  return (
    <div className="min-h-screen bg-off-white">
      <PageHeader
        title="Negotiation Strategy"
        subtitle="AI-powered insights to help you craft the perfect offer"
      />

      {/* Main Content */}
      <div className="mx-auto px-12 py-10 max-w-6xl">
        {/* Home selector */}
        <div className={sectionBox}>
          <div className={sectionTitle}>
            <Home className="h-5 w-5 text-brown" />
            Select a Home
          </div>
          <label className={label}>Choose from Your Favorite Homes</label>

          <div className="mb-6">
            <FavoriteHomesDropdown
              selectedHome={selectedHome}
              onHomeSelect={handleHomeSelection}
              placeholder="Select a favorite home for strategy generation"
            />
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              className={`${button} ${isLoading || !selectedHome ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleGenerate}
              disabled={!selectedHome || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Lightbulb className="h-5 w-5" />
                  Generate Strategy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className={sectionBox}>
            <div className="flex justify-center">
              <Loading message="Generating your personalized negotiation strategy..." />
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className={`${sectionBox} border-red-200 bg-red-50`}>
            <div className="text-red-600 text-center">
              <p className="font-semibold mb-2">Error Generating Strategy</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-3 text-red-500 hover:text-red-700 underline text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Strategy output - Dynamic display of all AI fields */}
        {strategyData && !isLoading && (
          <div className="space-y-6">
            {/* Header with Download and Share buttons */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-navy">Your Negotiation Strategy</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDownloadJson()}
                  className="bg-brown text-white px-4 py-2 rounded-lg font-medium hover:bg-brown/90 transition-colors duration-200 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download JSON
                </button>
                <button
                  onClick={() => handleShareJson()}
                  className="bg-olive text-white px-4 py-2 rounded-lg font-medium hover:bg-olive-light transition-colors duration-200 flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>
            </div>
            {Object.entries(strategyData).map(([key, value]) => {
              // Skip empty or null values
              if (!value || (typeof value === 'string' && value.trim() === '')) {
                return null;
              }

              // Skip metadata fields that shouldn't be displayed
              const metadataFields = ['section', 'success', 'task_id', 'generated_at', 'filename', 'strategy_id'];
              if (metadataFields.includes(key.toLowerCase())) {
                return null;
              }
              
              // Format the value for display with better styling - NO JSON
              const formatValue = (val: any): JSX.Element | string => {
                if (typeof val === 'object' && val !== null) {
                  if (Array.isArray(val)) {
                    // Format arrays as clean bullet points
                    return (
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        {val.map((item, idx) => (
                          <li key={idx} className="text-sm text-navy/80">
                            {typeof item === 'object' && item !== null ? 
                              // Handle objects properly - extract meaningful content
                              Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(', ').replace(/_/g, ' ') :
                              // Handle strings and primitives
                              String(item)
                                .replace(/_/g, ' ')
                                .replace(/([a-z])([A-Z])/g, '$1 $2')
                                .split(' ')
                                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                                .join(' ')
                            }
                          </li>
                        ))}
                      </ul>
                    );
                  } else {
                    // For objects, create clean structured display without JSON
                    return (
                      <div className="space-y-3">
                        {Object.entries(val).map(([subKey, subValue]) => {
                          // Format the sub-key nicely
                          const formattedKey = subKey
                            .replace(/_/g, ' ')
                            .replace(/([a-z])([A-Z])/g, '$1 $2')
                            .split(' ')
                            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');

                          return (
                            <div key={subKey} className="bg-gray-50/50 rounded-lg p-3 border-l-4 border-brown/30">
                              <div className="text-sm font-semibold text-brown mb-2">
                                {formattedKey}
                              </div>
                              <div className="text-sm text-navy/80">
                                {typeof subValue === 'object' && subValue !== null ? (
                                  Array.isArray(subValue) ? (
                                    <ul className="list-disc list-inside space-y-1 ml-2">
                                      {subValue.map((item, idx) => (
                                        <li key={idx} className="text-sm">
                                          {typeof item === 'object' ? 
                                            Object.entries(item).map(([k, v]) => 
                                              `${k.replace(/_/g, ' ')}: ${v}`
                                            ).join(', ') :
                                            item.toString().replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')
                                          }
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    // Nested objects - display as key-value pairs
                                    <div className="space-y-1">
                                      {Object.entries(subValue).map(([nestedKey, nestedValue]) => (
                                        <div key={nestedKey} className="text-xs bg-white/70 p-2 rounded">
                                           <span className="font-medium text-brown/80">
                                             {nestedKey.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
                                           </span>{' '}
                                          <span className="text-navy/70">
                                            {typeof nestedValue === 'boolean' ? 
                                              (nestedValue ? 'Yes' : 'No') :
                                              typeof nestedValue === 'number' ?
                                                nestedValue.toLocaleString() :
                                                Array.isArray(nestedValue) ?
                                                  nestedValue.join(', ').replace(/_/g, ' ') :
                                                  nestedValue?.toString().replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2') || 'Not specified'
                                            }
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )
                                ) : typeof subValue === 'boolean' ? (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    subValue ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {subValue ? 'Yes' : 'No'}
                                  </span>
                                ) : typeof subValue === 'number' ? (
                                  <span className="font-mono text-brown">
                                    {subValue.toLocaleString()}
                                  </span>
                                ) : (
                                  <p className="leading-relaxed">
                                    {subValue?.toString().replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2') || 'Not specified'}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                } else if (typeof val === 'boolean') {
                  return (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      val ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {val ? 'Yes' : 'No'}
                    </span>
                  );
                } else if (typeof val === 'number') {
                  return (
                    <span className="font-mono text-lg text-brown font-semibold">
                      {val.toLocaleString()}
                    </span>
                  );
                } else {
                  return (
                    <p className="leading-relaxed text-navy/80">
                      {val.toString().replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')}
                    </p>
                  );
                }
              };

              const formattedValue = formatValue(value);

              return (
                <div key={key} className={sectionBox}>
                  <div className="text-navy/80">
                    {typeof formattedValue === 'string' ? (
                      <p className="text-sm leading-relaxed">{formattedValue}</p>
                    ) : (
                      <div>{formattedValue}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
