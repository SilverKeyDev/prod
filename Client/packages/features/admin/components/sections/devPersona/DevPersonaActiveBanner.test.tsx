import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DevPersonaActiveBanner } from "./DevPersonaActiveBanner";

const navigateToPath = vi.fn();

vi.mock("packages/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("packages/navigation")>();
  return {
    ...actual,
    useNavigation: () => ({ navigateToPath }),
  };
});

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({ t: (key: string) => key }),
}));

const authState = {
  user: {
    id: "u1",
    email: "a@b.c",
    name: "Test",
    is_active: true,
    has_preferences: false,
    roles: ["agent", "admin"],
  },
};

const devPersonaSession = { serverIdentityTouched: false };

vi.mock("packages/store", () => ({
  useAuthStore: (sel: (s: typeof authState) => unknown) => sel(authState),
  useDevAppPersonaStore: (
    sel: (s: { serverIdentityTouched: typeof devPersonaSession.serverIdentityTouched }) => unknown
  ) => sel({ serverIdentityTouched: devPersonaSession.serverIdentityTouched }),
}));

describe("DevPersonaActiveBanner", () => {
  beforeEach(() => {
    navigateToPath.mockClear();
    devPersonaSession.serverIdentityTouched = false;
  });

  it("renders nothing when server identity was not toggled this session", () => {
    const { container } = render(<DevPersonaActiveBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("shows persona copy and navigates to settings", () => {
    devPersonaSession.serverIdentityTouched = true;
    render(<DevPersonaActiveBanner />);
    expect(screen.getByText(/admin\.dev_persona\.banner_prefix/)).toBeTruthy();
    expect(screen.getByText(/workspace\.switcher\.agent/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "admin.dev_persona.open_settings" }));
    expect(navigateToPath).toHaveBeenCalledWith("/admin/dev-persona");
  });
});
