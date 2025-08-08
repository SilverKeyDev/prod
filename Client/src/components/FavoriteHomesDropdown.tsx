import React, { useState, useRef, useEffect } from "react";
import { apiRequest } from "../lib/api";
import { formatFilenameToAddress } from "../lib/addressFormat";
import {
  ChevronDown,
  Home,
} from "lucide-react";

interface FavoriteHome {
  home_id: string;
  description?: string;
  [key: string]: any;
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
        
        if (res.success && res.favoriteHomes) {
          setFavoriteHomes(res.favoriteHomes);
        } else if (res.success && res.data?.favoriteHomes) {
          setFavoriteHomes(res.data.favoriteHomes);
        } else {
          setFavoriteHomes([]);
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
                {formatFilenameToAddress(selectedHome.home_id) || selectedHome.home_id}
              </div>
              <div className="text-xs text-gray-500">
                Selected Property
              </div>
            </div>
          ) : (
            <div>
              <div className="text-sm text-gray-500">
                {placeholder}
              </div>
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
              const formattedAddress = formatFilenameToAddress(home.home_id) || home.home_id;
              return (
                <button
                  key={home.home_id}
                  onClick={() => handleHomeSelection(home)}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors duration-150 ${
                    index === 0 ? "first:rounded-t-lg" : ""
                  } ${index === favoriteHomes.length - 1 ? "last:rounded-b-lg" : ""} ${
                    selectedHome?.home_id === home.home_id
                      ? "bg-brown/10 text-brown font-medium"
                      : "text-black hover:bg-brown/5"
                  }`}
                >
                  <div className="font-medium">{formattedAddress}</div>
                  {home.description && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {home.description}
                    </div>
                  )}
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
