/**
 * Effect hooks used by useSecureAuth: proactive refresh, visibility refresh, auth-ready dispatch.
 */

import { useEffect } from "react";

import { log, LOG_CATEGORIES } from "logger";

import { getEnv } from "packages/config";
import type { UserProfile } from "packages/schemas/app/auth/user";
import { asError } from "packages/utils";
import { getDocument, getWindow } from "packages/utils/core/platform";
import { getSessionStorage } from "packages/utils/core/storage/platformStorage";

export function useProactiveTokenRefresh(
  accessToken: string | null,
  user: UserProfile | null,
  refreshToken: () => Promise<boolean>,
): void {
  useEffect(() => {
    if (!accessToken || !user) return;
    const checkInterval = setInterval(
      () => {
        void refreshToken();
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(checkInterval);
  }, [accessToken, user, refreshToken]);
}

export function useVisibilityRefresh(
  accessToken: string | null,
  refreshToken: () => Promise<boolean>,
  user: UserProfile | null,
): void {
  useEffect(() => {
    const doc = getDocument();
    if (!doc) return;
    const handleVisibilityChange = () => {
      if (doc.hidden) {
        if (user && accessToken && getEnv().isDevelopment) {
          log.debug(LOG_CATEGORIES.AUTH, "Page hidden - security checkpoint");
        }
      } else {
        if (accessToken) void refreshToken();
      }
    };
    doc.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      doc.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [accessToken, refreshToken, user]);
}

export function useAuthReadyDispatch(
  user: UserProfile | null,
  accessToken: string | null,
  isLoading: boolean,
): void {
  useEffect(() => {
    if (!user || !accessToken || isLoading) return;
    const sess = getSessionStorage();
    if (sess.getItem("auth_ready_dispatched")) return;

    const win = getWindow();
    try {
      const authReadyEvent = new CustomEvent("authReady", {
        detail: { user, accessToken },
      });
      setTimeout(() => {
        try {
          if (win) win.dispatchEvent(authReadyEvent);
        } catch (dispatchError) {
          log.warn(LOG_CATEGORIES.AUTH, "Auth ready event dispatch failed", {
            error: asError(dispatchError).message,
          });
        }
      }, 0);
    } catch (eventCreationError) {
      log.warn(LOG_CATEGORIES.AUTH, "Auth ready event creation failed", {
        error: asError(eventCreationError).message,
      });
    }

    if (getEnv().isDevelopment) {
      log.debug(LOG_CATEGORIES.AUTH, "Auth ready event dispatched", {
        userId: user?.id ?? "unknown",
        userEmail: user?.email ?? "unknown",
      });
    }
    sess.setItem("auth_ready_dispatched", "true");
  }, [user, accessToken, isLoading]);
}
