import { useState, useCallback } from 'react';

export interface ModalState {
  [modalId: string]: boolean;
}

export interface UseModalReturn {
  modals: ModalState;
  isOpen: (modalId: string) => boolean;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
  closeAllModals: () => void;
}

export function useModal(initialModals: string[] = []): UseModalReturn {
  const [modals, setModals] = useState<ModalState>(() => {
    const initial: ModalState = {};
    initialModals.forEach(modalId => {
      initial[modalId] = false;
    });
    return initial;
  });

  const isOpen = useCallback((modalId: string): boolean => {
    return Boolean(modals[modalId]);
  }, [modals]);

  const openModal = useCallback((modalId: string) => {
    setModals(prev => ({ ...prev, [modalId]: true }));
  }, []);

  const closeModal = useCallback((modalId: string) => {
    setModals(prev => ({ ...prev, [modalId]: false }));
  }, []);

  const toggleModal = useCallback((modalId: string) => {
    setModals(prev => ({ ...prev, [modalId]: !prev[modalId] }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(prev => {
      const newState: ModalState = {};
      Object.keys(prev).forEach(key => {
        newState[key] = false;
      });
      return newState;
    });
  }, []);

  return {
    modals,
    isOpen,
    openModal,
    closeModal,
    toggleModal,
    closeAllModals
  };
}

export default useModal;
