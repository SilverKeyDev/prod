import { create } from 'zustand';

// Mock store for testing
export const useMockStore = create((set) => ({
  // Auth state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  
  // Search state
  searchResults: [],
  currentSearch: null,
  
  // UI state
  sidebarOpen: false,
  theme: 'light',
  
  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setCurrentSearch: (currentSearch) => set({ currentSearch }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
  
  // Reset function for tests
  reset: () => set({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    searchResults: [],
    currentSearch: null,
    sidebarOpen: false,
    theme: 'light',
  }),
}));

// Helper function to reset all stores in tests
export const resetAllStores = () => {
  useMockStore.getState().reset();
};

