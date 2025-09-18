import { useUIStore } from '../../store/ui.slice';

/**
 * Hook that integrates UI data with useUIStore
 * This replaces the UIProvider functionality
 * 
 * Note: UI doesn't have a dedicated data hook yet,
 * so this integration hook primarily manages the store state
 */
export function useUIStoreIntegration() {
  const {
    isAnyModalOpen,
    isAnyDrawerOpen,
    isGlobalLoading,
    isCarouselCollapsed,
    showPropertyModals,
    activeToastId,
    toastQueue,
    openModal,
    closeModal,
    toggleModal,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    setGlobalLoading,
    setCarouselCollapsed,
    setShowPropertyModals,
    enqueueToast,
    dequeueToast,
    clearToasts,
  } = useUIStore();

  // Expose the store state and actions
  return {
    // State
    isAnyModalOpen,
    isAnyDrawerOpen,
    isGlobalLoading,
    isCarouselCollapsed,
    showPropertyModals,
    activeToastId,
    toastQueue,

    // Actions
    openModal,
    closeModal,
    toggleModal,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    setGlobalLoading,
    setCarouselCollapsed,
    setShowPropertyModals,
    enqueueToast,
    dequeueToast,
    clearToasts,
  };
}
