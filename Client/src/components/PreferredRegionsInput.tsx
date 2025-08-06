import React, { useState, useRef, useEffect } from "react";
import { MapPin, Plus, X } from "lucide-react";

interface PreferredRegion {
  name: string;
  address: string;
}

interface Suggestion {
  placePrediction: any;
  description: string;
}

interface PreferredRegionsInputProps {
  regions: PreferredRegion[];
  onChange: (regions: PreferredRegion[]) => void;
  scriptsReady: boolean;
  isEditMode?: boolean;
}

const PreferredRegionsInput: React.FC<PreferredRegionsInputProps> = ({
  regions,
  onChange,
  scriptsReady,
  isEditMode = true,
}) => {
  const [isAddingRegion, setIsAddingRegion] = useState(false);
  const [regionAddress, setRegionAddress] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [hasSelected, setHasSelected] = useState(false);
  
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Fetch autocomplete suggestions as the user types
  useEffect(() => {
    if (!scriptsReady || regionAddress.trim().length < 3 || hasSelected) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const sessionToken =
          new window.google.maps.places.AutocompleteSessionToken();
        const request = {
          input: regionAddress,
          sessionToken,
        };

        const { suggestions: fetched } =
          await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            request
          );

        setSuggestions(
          fetched.map((s: any) => ({
            description: s.placePrediction.text.text,
            placePrediction: s.placePrediction,
          }))
        );
      } catch (err) {
        console.error("Autocomplete fetch error:", err);
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(debounce);
  }, [regionAddress, scriptsReady, hasSelected]);

  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasSelected(false);
    setRegionAddress(e.target.value);
  };

  const handleSelect = async (suggestion: Suggestion) => {
    setHasSelected(true);
    const place = suggestion.placePrediction.toPlace();
    await place.fetchFields({
      fields: ["displayName", "formattedAddress"],
    });
    setRegionAddress(place.formattedAddress);
    setSuggestions([]);
  };

  const handleAddRegion = () => {
    if (regionAddress.trim()) {
      const newRegion: PreferredRegion = {
        name: regionAddress.trim(), // For compatibility, use address as the name
        address: regionAddress.trim(),
      };
      onChange([...regions, newRegion]);
      setRegionAddress("");
      setIsAddingRegion(false);
      setHasSelected(false);
    }
  };


  const handleRemoveRegion = (index: number) => {
    const updatedRegions = [...regions];
    updatedRegions.splice(index, 1);
    onChange(updatedRegions);
  };



  const handleCancel = () => {
    setIsAddingRegion(false);
    setRegionAddress("");
    setHasSelected(false);
    setSuggestions([]);
  };

  return (
    <div className="space-y-4">
      {/* Existing Regions */}
      {regions.length > 0 && (
        <div className="space-y-3">
          {regions.map((region, index) => (
            <div
              key={index}
              className="flex items-start justify-between p-3 bg-beige/20 rounded-lg border border-beige min-h-[60px]"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-black text-sm">{region.name}</h4>
                {region.name !== region.address && (
                  <p className="text-xs text-black/60 mt-1 break-words">{region.address}</p>
                )}
              </div>
              {isEditMode && (
                <button
                  type="button"
                  onClick={() => handleRemoveRegion(index)}
                  className="ml-3 p-1 text-black/40 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add New Region */}
      {isEditMode && (
        <>
          {!isAddingRegion ? (
            <button
              type="button"
              onClick={() => setIsAddingRegion(true)}
              className="flex items-center space-x-2 text-brown hover:text-brown/80 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Add Preferred Region</span>
            </button>
          ) : (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {/* Region Input with Autocomplete */}
              <div className="relative">
                <label className="block text-sm font-medium text-black mb-2">
                  Region
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40 pointer-events-none z-10" />
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={regionAddress}
                    onChange={handleAddressInputChange}
                    placeholder={scriptsReady ? "Search for region..." : "Loading..."}
                    disabled={!scriptsReady}
                    className="w-full h-12 pl-10 pr-3 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-olive focus:border-olive transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                    autoComplete="off"
                  />
                </div>

                {/* Region Suggestions */}
                {suggestions.length > 0 && (
                  <ul className="border mt-2 rounded-md overflow-hidden shadow-sm bg-white z-50 relative max-h-60 overflow-y-auto">
                    {suggestions.map((s, idx) => (
                      <li
                        key={idx}
                        onClick={() => handleSelect(s)}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm border-b border-gray-100 last:border-b-0"
                      >
                        {s.description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleAddRegion}
                  disabled={!regionAddress.trim()}
                  className="px-4 py-2 bg-olive text-white text-sm font-medium rounded-lg hover:bg-olive/80 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Region
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PreferredRegionsInput;
