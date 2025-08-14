import React, { useState, useRef, useEffect } from "react";
import { apiRequest } from "../lib/api";
import { ChevronDown, Home } from "lucide-react";

interface FavoriteHome {
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
}

interface FavoriteHomesDropdownProps {
  selectedHome: FavoriteHome | null;
  onHomeSelect: (home: FavoriteHome) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

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
          const homes: FavoriteHome[] = res.favorites.map((home: any) => ({
            user_id: home.user_id,
            address: home.address,
            beds: home.beds,
            baths: home.baths,
            sqft: home.sqft,
            lot_size: home.lot_size,
            price: home.price,
            image_url: home.image_url,
            created_at: home.created_at,
            updated_at: home.updated_at
          }));
          setFavoriteHomes(homes);
        } 
      } catch (error) {
        console.error("Error fetching favorite homes:", error);
        setFavoriteHomes([]);
      } finally {
        setLoadingHomes(false);
      }
    };

    fetchFavoriteHomes();
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
        className={`flex items-center gap-3 px-4 py-2 border border-beige rounded-lg bg-white hover:border-brown focus:border-brown focus:ring-2 focus:ring-brown/20 transition-colors duration-200 w-full ${className}`}
        disabled={disabled || loadingHomes}
      >
        <Home className="h-4 w-4 text-brown" />
        <div className="flex-1 text-left">
          {loadingHomes ? (
            <span className="text-gray-500">Loading homes...</span>
          ) : selectedHome ? (
            <div>
              <div className="text-sm font-medium text-navy">
                {selectedHome.address}
              </div>
              <div className="text-xs text-gray-500">
                {selectedHome.beds && selectedHome.baths ? 
                  `${selectedHome.beds} bed, ${selectedHome.baths} bath` : 
                  'Selected Property'
                }
                {selectedHome.price && ` • ${selectedHome.price}`}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm text-gray-500">{placeholder}</div>
              <div className="text-xs text-gray-400">
                Choose from your saved properties
              </div>
            </div>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 text-brown ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isDropdownOpen && !loadingHomes && !disabled && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-beige rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {favoriteHomes.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No favorite homes found
            </div>
          ) : (
            favoriteHomes.map((home, index) => {
              return (
                <button
                  key={home.address}
                  onClick={() => handleHomeSelection(home)}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors duration-150 ${
                    index === 0 ? "first:rounded-t-lg" : ""
                  } ${
                    index === favoriteHomes.length - 1
                      ? "last:rounded-b-lg"
                      : ""
                  } ${
                    selectedHome?.address === home.address
                      ? "bg-brown/10 text-brown"
                      : "text-black hover:bg-brown/5"
                  }`}
                >
                  <div className="font-medium">{home.address}</div>
                  <div className="text-xs text-gray-500 mt-1 truncate">
                    {home.beds && home.baths ? 
                      `${home.beds} bed, ${home.baths} bath` : 
                      'Property details'
                    }
                    {home.sqft && ` • ${home.sqft} sqft`}
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
