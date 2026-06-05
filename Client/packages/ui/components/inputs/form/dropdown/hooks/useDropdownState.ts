import { useCallback, useEffect, useRef, useState } from "react";

import { getDocument } from "packages/utils/core/platform";

export type UseDropdownStateProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  searchable?: boolean;
  disabled?: boolean;
  canPortalMenu: boolean;
};

export function useDropdownState({
  isOpen,
  setIsOpen,
  searchable,
  disabled,
  canPortalMenu,
}: UseDropdownStateProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuPortalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Handle click outside
  useEffect(() => {
    const doc = getDocument();
    if (!doc) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current?.contains(target)) return;
      if (canPortalMenu && menuPortalRef.current?.contains(target)) return;
      setIsOpen(false);
      setSearchTerm("");
    };
    if (isOpen) {
      doc.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      doc.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, canPortalMenu, setIsOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  }, [disabled, isOpen, setIsOpen]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    dropdownRef,
    menuPortalRef,
    searchInputRef,
    handleToggle,
    handleSearchChange,
  };
}
