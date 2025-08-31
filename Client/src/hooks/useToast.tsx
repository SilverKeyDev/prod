import { useState, useCallback } from 'react';
import ErrorToast from '../components/feedback/ErrorToast';
import SuccessToast from '../components/feedback/SuccessToast';

interface ToastState {
  showError: boolean;
  showSuccess: boolean;
  errorMessage: string;
  successMessage: string;
}

export function useToast() {
  const [toastState, setToastState] = useState<ToastState>({
    showError: false,
    showSuccess: false,
    errorMessage: '',
    successMessage: ''
  });

  const showError = useCallback((message: string, duration = 5000) => {
    setToastState(prev => ({
      ...prev,
      showError: true,
      errorMessage: message
    }));
    
    setTimeout(() => {
      setToastState(prev => ({ ...prev, showError: false }));
    }, duration);
  }, []);

  const showSuccess = useCallback((message: string, duration = 3000) => {
    setToastState(prev => ({
      ...prev,
      showSuccess: true,
      successMessage: message
    }));
    
    setTimeout(() => {
      setToastState(prev => ({ ...prev, showSuccess: false }));
    }, duration);
  }, []);

  const hideError = useCallback(() => {
    setToastState(prev => ({ ...prev, showError: false }));
  }, []);

  const hideSuccess = useCallback(() => {
    setToastState(prev => ({ ...prev, showSuccess: false }));
  }, []);

  const ToastContainer = () => (
    <>
      {toastState.showError && (
        <ErrorToast
          message={toastState.errorMessage}
          onClose={hideError}
          duration={5000}
        />
      )}
      {toastState.showSuccess && (
        <SuccessToast
          message={toastState.successMessage}
          onClose={hideSuccess}
          duration={3000}
        />
      )}
    </>
  );

  return {
    showError,
    showSuccess,
    hideError,
    hideSuccess,
    ToastContainer,
    isShowingError: toastState.showError,
    isShowingSuccess: toastState.showSuccess,
    errorMessage: toastState.errorMessage,
    successMessage: toastState.successMessage
  };
}
