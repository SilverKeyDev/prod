import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DevPersonaActiveBanner } from "./DevPersonaActiveBanner";

const navigateToPath = vi.fn();

vi.mock("packages/navigation", () => ({
  useNavigation: () => ({ navigateToPath }),
}));

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({ t: (key: string) => key }),
}));

const authState = {
  user: {
    id: "u1",
    email: "a@b.c",
    name: "Test",
    is_active: true,
    is_agent: true,
    has_subscription: false,
    subscription: null,
    has_preferences: false,
    roles: ["admin"],
  },
};

const devPersonaSession = { persona: null as "agent" | "buyer" | null };

vi.mock("packages/store", () => ({
  useAuthStore: (sel: (s: typeof authState) => unknown) => sel(authState),
  useDevAppPersonaStore: (sel: (s: { persona: typeof devPersonaSession.persona }) => unknown) =>
    sel({ persona: devPersonaSession.persona }),
}));

describe("DevPersonaActiveBanner", () => {
  beforeEach(() => {
    navigateToPath.mockClear();
    devPersonaSession.persona = null;
  });

  it("renders nothing when session persona is unset", () => {
    const { container } = render(<DevPersonaActiveBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("shows derived persona copy and navigates to settings", () => {
    devPersonaSession.persona = "agent";
    render(<DevPersonaActiveBanner />);
    expect(screen.getByText(/admin\.dev_persona\.banner_agent_shell/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "admin.dev_persona.open_settings" }));
    expect(navigateToPath).toHaveBeenCalledWith("/admin/dev-persona");
  });
});
