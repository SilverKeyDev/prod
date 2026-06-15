import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exchange: vi.fn(),
}));

vi.mock("packages/features/admin/api/admin", () => ({
  adminApi: {
    exchangeDevAccountSession: mocks.exchange,
  },
}));

vi.mock("packages/logger", () => ({
  LOG_CATEGORIES: { API: "API", AUTH: "AUTH" },
  log: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    security: vi.fn(),
    warn: vi.fn(),
  },
}));

import { useAuthStore, useUserStore } from "packages/store";
import { setPlatformStorage } from "packages/utils/core/storage";

import DevSessionPage from "./DevSessionPage";

function renderPage(initialEntry = "/dev/session?t=one-time-token") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/dev/session" element={<DevSessionPage />} />
        <Route path="/search" element={<div data-testid="search-page">Search</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("DevSessionPage", () => {
  beforeEach(() => {
    mocks.exchange.mockReset();
    window.sessionStorage.clear();
    setPlatformStorage({
      persistStorage: window.localStorage,
      local: window.localStorage,
      session: window.sessionStorage,
    });
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      authStatus: "unauthenticated",
    });
    useUserStore.setState({ userProfile: null });
  });

  it("exchanges a one-time token, stores a tab-scoped bearer token, and navigates", async () => {
    mocks.exchange.mockResolvedValueOnce({
      success: true,
      access_token: "tab-access-token",
      user_sub: "dev-sub",
      user: {
        id: "dev-buyer",
        email: "dev+admin-buyer@dev.usesilverkey.com",
        name: "Dev Buyer",
        is_agent: false,
        roles: ["buyer", "dev_test_account"],
        auth_method: "dev_session",
      },
    });

    const { getByTestId } = renderPage();

    await waitFor(() => {
      expect(getByTestId("search-page")).toBeTruthy();
    });
    expect(mocks.exchange).toHaveBeenCalledWith("one-time-token");
    expect(window.sessionStorage.getItem("dev_session_access_token")).toBe("tab-access-token");
  });

  it("can hold a different token in a separate tab-scoped storage instance", async () => {
    window.sessionStorage.setItem("dev_session_access_token", "buyer-token");
    const buyerTabToken = window.sessionStorage.getItem("dev_session_access_token");

    window.sessionStorage.clear();
    window.sessionStorage.setItem("dev_session_access_token", "brokerage-token");

    expect(buyerTabToken).toBe("buyer-token");
    expect(window.sessionStorage.getItem("dev_session_access_token")).toBe("brokerage-token");
  });
});
