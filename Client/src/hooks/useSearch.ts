import { useState, useMemo, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export interface UseSearchOptions<T> {
  searchFields: (keyof T)[];
  initialSortKey?: keyof T;
  initialSortDirection?: SortDirection;
  caseSensitive?: boolean;
}

export interface UseSearchReturn<T> {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortConfig: SortConfig<T> | null;
  setSortConfig: (config: SortConfig<T> | null) => void;
  sortBy: (key: keyof T) => void;
  filteredData: T[];
  clearSearch: () => void;
  clearSort: () => void;
  clearAll: () => void;
}

export function useSearch<T>(
  data: T[],
  options: UseSearchOptions<T>
): UseSearchReturn<T> {
  const {
    searchFields,
    initialSortKey,
    initialSortDirection = 'asc',
    caseSensitive = false
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(
    initialSortKey ? { key: initialSortKey, direction: initialSortDirection } : null
  );

  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm.trim()) {
      const searchValue = caseSensitive ? searchTerm : searchTerm.toLowerCase();
      
      filtered = data.filter(item =>
        searchFields.some(field => {
          const fieldValue = item[field];
          if (fieldValue == null) return false;
          
          const stringValue = String(fieldValue);
          const compareValue = caseSensitive ? stringValue : stringValue.toLowerCase();
          
          return compareValue.includes(searchValue);
        })
      );
    }

    // Apply sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

        // Handle different data types
        let comparison = 0;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = caseSensitive 
            ? aValue.localeCompare(bValue)
            : aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime();
        } else {
          // Fallback to string comparison
          const aString = String(aValue);
          const bString = String(bValue);
          comparison = caseSensitive 
            ? aString.localeCompare(bString)
            : aString.toLowerCase().localeCompare(bString.toLowerCase());
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig, searchFields, caseSensitive]);

  const sortBy = useCallback((key: keyof T) => {
    setSortConfig(prevConfig => {
      if (prevConfig && prevConfig.key === key) {
        // Toggle direction if same key
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        // New key, default to ascending
        return { key, direction: 'asc' };
      }
    });
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const clearSort = useCallback(() => {
    setSortConfig(null);
  }, []);

  const clearAll = useCallback(() => {
    setSearchTerm('');
    setSortConfig(null);
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    sortConfig,
    setSortConfig,
    sortBy,
    filteredData,
    clearSearch,
    clearSort,
    clearAll
  };
}

export default useSearch;
