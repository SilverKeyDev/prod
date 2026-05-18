import { useCallback, useState } from "react";

export function useLogoutConfirm(onLogout: () => void) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = useCallback(() => {
    setShowLogoutConfirm(true);
  }, []);

  const handleConfirmLogout = useCallback(() => {
    setShowLogoutConfirm(false);
    onLogout();
  }, [onLogout]);

  const handleCancelLogout = useCallback(() => {
    setShowLogoutConfirm(false);
  }, []);

  return {
    showLogoutConfirm,
    handleLogoutClick,
    handleConfirmLogout,
    handleCancelLogout,
  };
}
