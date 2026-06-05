import React from "react";

import { Icon } from "@ui/icons";

import { color } from "packages/design-tokens";
import { useAuthStoreIntegration } from "packages/features/homeauth/hooks/store/useAuthStoreIntegration";
import { useLogoutConfirm } from "packages/features/homeauth/hooks/ui/useLogoutConfirm";
import { Box, TouchableBox } from "packages/ui/components/structure/primitives";
import { getChromeNavButtonStyles } from "packages/ui/components/structure/sidebar/sidebarTheme";
import { ConfirmationDialog } from "packages/ui/components/surfaces/modals";
import { isWeb } from "packages/utils/core/platform";

import { BodyText, Button } from "@/components/ui";

const LOGOUT_CONFIRM_TITLE = "Logout Confirmation";
const LOGOUT_CONFIRM_MESSAGE = "Are you sure you want to log out?";
const LOGOUT_LABEL = "Logout";

const sidebarNavLabelInactive = "text-sm font-medium";
const SIDEBAR_LOGOUT_COLOR = "text-white";
const PROFILE_LOGOUT_COLOR = "text-text-secondary";

export type AccountLogoutActionProps = {
  /** Defaults to auth store integration logout when omitted. */
  onLogout?: () => void;
  variant: "sidebar" | "profile";
  /** Sidebar only: show label beside icon when the nav column is expanded. */
  expanded?: boolean;
  /** Profile only: `footer` pins below scroll content without extra top margin. */
  placement?: "inline" | "footer";
};

export function AccountLogoutAction({
  onLogout: onLogoutProp,
  variant,
  expanded = true,
  placement = "inline",
}: AccountLogoutActionProps) {
  const { logout } = useAuthStoreIntegration();
  const onLogout = onLogoutProp ?? logout;
  const { showLogoutConfirm, handleLogoutClick, handleConfirmLogout, handleCancelLogout } =
    useLogoutConfirm(onLogout);

  const confirmDialog = (
    <ConfirmationDialog
      isOpen={showLogoutConfirm}
      title={LOGOUT_CONFIRM_TITLE}
      message={LOGOUT_CONFIRM_MESSAGE}
      confirmText={LOGOUT_LABEL}
      confirmIcon={<Icon name="log-out" />}
      onConfirm={handleConfirmLogout}
      onCancel={handleCancelLogout}
    />
  );

  if (variant === "profile") {
    const containerClass =
      placement === "footer"
        ? "border-border border-t px-4 py-4"
        : "border-border mt-6 border-t pt-6";

    return (
      <Box className={containerClass}>
        <TouchableBox
          onPress={handleLogoutClick}
          label={LOGOUT_LABEL}
          className="min-h-11 flex-row items-center justify-center py-3"
        >
          <Icon
            name="log-out"
            className={`h-6 w-6 ${PROFILE_LOGOUT_COLOR}`}
            color={color("text-secondary")}
          />
          <BodyText as="span" size="sm" className={`ml-3 font-medium ${PROFILE_LOGOUT_COLOR}`}>
            {LOGOUT_LABEL}
          </BodyText>
        </TouchableBox>
        {confirmDialog}
      </Box>
    );
  }

  const sidebarButtonClass = `${getChromeNavButtonStyles(false).replace(
    "text-sidebar-muted-foreground",
    SIDEBAR_LOGOUT_COLOR
  )} ${SIDEBAR_LOGOUT_COLOR} cursor-pointer justify-center py-3`;

  return (
    <Box className="border-sidebar-border flex-shrink-0 border-t py-4">
      {isWeb ? (
        <Button
          type="button"
          variant="ghost"
          onClick={handleLogoutClick}
          className={sidebarButtonClass}
          label={LOGOUT_LABEL}
        >
          <Icon
            name="log-out"
            className={`h-6 w-6 ${SIDEBAR_LOGOUT_COLOR} ${expanded ? "mr-3" : ""}`}
          />
          {expanded ? (
            <BodyText
              as="span"
              size="sm"
              className={`${sidebarNavLabelInactive} ${SIDEBAR_LOGOUT_COLOR}`}
            >
              {LOGOUT_LABEL}
            </BodyText>
          ) : null}
        </Button>
      ) : null}
      {confirmDialog}
    </Box>
  );
}
