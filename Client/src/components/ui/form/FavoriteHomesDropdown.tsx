import { ChevronDown, Home } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

import { apiRequest } from "../../../core/config/api";
import KeyTurnLoader from "../loading/KeyTurnLoader";

type FavoriteHome = {
  user_id: string;
  address: string;
  beds: string;
  baths: string;
  sqft: string;
  lot_size: string;
  price: string;
  image_url: string;
  created_at: string;
  updated_at: string;
};

type FavoriteHomesDropdownProps = {
  selectedHome: FavoriteHome | null;
  onHomeSelect: (home: FavoriteHome) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
};

const FavoriteHomesDropdown: React.FC<FavoriteHomesDropdownProps> = ({
  selectedHome,
  onHomeSelect,
  className = "",
  placeholder = "Select a favorite home",
  disabled = false,
}) => {
  // State management
  const [favoriteHomes, setFavoriteHomes] = useState<FavoriteHome[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loadingHomes, setLoadingHomes] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch favorite homes on component mount
  useEffect(() => {
    const fetchFavoriteHomes = async () => {
      try {
        setLoadingHomes(true);
        const res = await apiRequest("/api/v1/user/favorite-homes");

        if (res.success && Array.isArray(res.favorites)) {
          // Backend returns array of HomeUniversal objects with full property data
          const responseData = res as Record<string, unknown>;
          const homes: FavoriteHome[] = (
            responseData.favorites as unknown[]
          ).map((home: unknown) => {
            // Type-safe mapping with proper type guards
            const typedHome = home as Record<string, unknown>;
            return {
              user_id:
                typeof typedHome.user_id === "string" ? typedHome.user_id : "",
              address:
                typeof typedHome.address === "string" ? typedHome.address : "",
              beds: typeof typedHome.beds === "number" ? typedHome.beds : 0,
              baths: typeof typedHome.baths === "number" ? typedHome.baths : 0,
              sqft: typeof typedHome.sqft === "number" ? typedHome.sqft : 0,
              lot_size:
                typeof typedHome.lot_size === "string"
                  ? typedHome.lot_size
                  : "",
              price: typeof typedHome.price === "string" ? typedHome.price : "",
              image_url:
                typeof typedHome.image_url === "string"
                  ? typedHome.image_url
                  : "",
              created_at:
                typeof typedHome.created_at === "string"
                  ? typedHome.created_at
                  : "",
              updated_at:
                typeof typedHome.updated_at === "string"
                  ? typedHome.updated_at
                  : "",
            };
          });
          setFavoriteHomes(homes);
        }
      } catch (error: unknown) {
        console.error("Error fetching favorite homes:", error);
        setFavoriteHomes([]);
      } finally {
        setLoadingHomes(false);
      }
    };

    void void fetchFavoriteHomes();
  }, []);

  // Handle dropdown toggle
  const toggleDropdown = () => {
    if (!disabled && !loadingHomes) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  // Handle home selection
  const handleHomeSelection = (home: FavoriteHome) => {
    onHomeSelect(home);
    setIsDropdownOpen(false);
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className={`flex h-full w-full items-center gap-2 rounded-lg border border-beige bg-white px-2 py-2 transition-colors duration-200 hover:border-brown focus:border-brown focus:ring-2 focus:ring-brown/20 lg:px-3 lg:py-3 ${className}`}
        disabled={disabled ?? loadingHomes}
      >
        <Home className="h-4 w-4 text-brown" />
        <div className="flex-1 text-left">
          {loadingHomes ? (
            <KeyTurnLoader message="Loading homes..." />
          ) : selectedHome ? (
            <div>
              <div className="text-responsive-xs font-medium text-navy">
                <span className="block sm:hidden">
                  {(() => {
                    const { address } = selectedHome;
                    const lastCommaIndex = address.lastIndexOf(",");
                    return lastCommaIndex > 0
                      ? address.substring(0, lastCommaIndex)
                      : address;
                  })()}
                </span>
                <span className="hidden sm:block">{selectedHome.address}</span>
              </div>
              <div className="text-responsive-xs hidden text-gray-500 sm:block">
                {selectedHome.beds && selectedHome.baths
                  ? `${selectedHome.beds} bed, ${selectedHome.baths} bath`
                  : "Selected Property"}
                {selectedHome.price && ` • ${selectedHome.price}`}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-responsive-xs text-gray-500">
                {placeholder}
              </div>
              <div className="text-responsive-xs hidden text-gray-400 sm:block">
                Choose from your saved properties
              </div>
            </div>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-brown transition-transform duration-200 ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isDropdownOpen && !loadingHomes && !disabled && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-beige bg-white shadow-lg">
          {favoriteHomes.length === 0 ? (
            <div className="px-3 py-2 text-center text-sm text-gray-500">
              No favorite homes found
            </div>
          ) : (
            favoriteHomes.map((home, index) => {
              return (
                <button
                  key={home.address}
                  onClick={() => handleHomeSelection(home)}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors duration-150 ${
                    index === 0 ? "first:rounded-t-lg" : ""
                  } ${index === favoriteHomes.length - 1 ? "last:rounded-b-lg" : ""} ${
                    selectedHome?.address === home.address
                      ? "bg-brown/10 text-brown"
                      : "text-black hover:bg-brown/5"
                  }`}
                >
                  <div className="text-responsive-xs font-medium">
                    <span className="block sm:hidden">
                      {(() => {
                        const { address } = home;
                        const lastCommaIndex = address.lastIndexOf(",");
                        return lastCommaIndex > 0
                          ? address.substring(0, lastCommaIndex)
                          : address;
                      })()}
                    </span>
                    <span className="hidden sm:block">{home.address}</span>
                  </div>
                  <div className="text-responsive-xs mt-1 hidden text-gray-500 sm:block">
                    {home.beds && home.baths
                      ? `${home.beds} bed, ${home.baths} bath`
                      : "Property details"}
                    {home.sqft &&
                      Number(home.sqft) > 0 &&
                      ` • ${Math.round(Number(home.sqft)).toLocaleString()} sqft`}
                    {home.price && ` • ${home.price}`}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default FavoriteHomesDropdown;
