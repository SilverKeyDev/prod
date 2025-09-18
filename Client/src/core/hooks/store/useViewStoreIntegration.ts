import { useViewStore } from '../../store/view.slice';

/**
 * Hook that integrates view data with useViewStore
 * This replaces the ViewProvider functionality
 * 
 * Note: View doesn't have a dedicated data hook yet,
 * so this integration hook primarily manages the store state
 */
export function useViewStoreIntegration() {
  const {
    sidebarExpanded,
    openCategories,
    dropdownSelections,
    personalizationEditMode,
    personalizationActiveSection,
    setSidebarExpanded,
    setCategoryOpen,
    toggleCategory,
    setDropdownSelection,
    clearDropdownSelection,
    setPersonalizationEditMode,
    setPersonalizationActiveSection,
  } = useViewStore();

  // Expose the store state and actions
  return {
    // State
    sidebarExpanded,
    openCategories,
    dropdownSelections,
    personalizationEditMode,
    personalizationActiveSection,

    // Actions
    setSidebarExpanded,
    setCategoryOpen,
    toggleCategory,
    setDropdownSelection,
    clearDropdownSelection,
    setPersonalizationEditMode,
    setPersonalizationActiveSection,
  };
}
