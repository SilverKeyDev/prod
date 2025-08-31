import { useState, useCallback } from 'react';

export interface LoadingState {
  [key: string]: boolean;
}

export interface UseLoadingReturn {
  loadingStates: LoadingState;
  isLoading: (key: string) => boolean;
  setLoading: (key: string, loading: boolean) => void;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  toggleLoading: (key: string) => void;
  clearAllLoading: () => void;
  isAnyLoading: () => boolean;
}

export function useLoading(initialStates: string[] = []): UseLoadingReturn {
  const [loadingStates, setLoadingStates] = useState<LoadingState>(() => {
    const initial: LoadingState = {};
    initialStates.forEach(state => {
      initial[state] = false;
    });
    return initial;
  });

  const isLoading = useCallback((key: string): boolean => {
    return Boolean(loadingStates[key]);
  }, [loadingStates]);

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const startLoading = useCallback((key: string) => {
    setLoadingStates(prev => ({ ...prev, [key]: true }));
  }, []);

  const stopLoading = useCallback((key: string) => {
    setLoadingStates(prev => ({ ...prev, [key]: false }));
  }, []);

  const toggleLoading = useCallback((key: string) => {
    setLoadingStates(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const clearAllLoading = useCallback(() => {
    setLoadingStates(prev => {
      const newState: LoadingState = {};
      Object.keys(prev).forEach(key => {
        newState[key] = false;
      });
      return newState;
    });
  }, []);

  const isAnyLoading = useCallback((): boolean => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  return {
    loadingStates,
    isLoading,
    setLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    clearAllLoading,
    isAnyLoading
  };
}

export default useLoading;
