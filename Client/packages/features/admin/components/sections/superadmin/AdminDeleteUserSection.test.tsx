import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminDeleteUserSection } from "./AdminDeleteUserSection";

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({
    t: (key: string) => key,
  }),
}));

const { deleteUserById } = vi.hoisted(() => ({
  deleteUserById: vi.fn(),
}));

vi.mock("packages/api/admin", () => ({
  adminApi: {
    deleteUserById,
  },
}));

vi.mock("packages/logger", () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    security: vi.fn(),
  },
  LOG_CATEGORIES: {
    API: "API",
    SECURITY: "SECURITY",
    ERRORS: "ERRORS",
  },
}));

describe("AdminDeleteUserSection", () => {
  beforeEach(() => {
    deleteUserById.mockReset();
  });

  it("keeps delete disabled until id and acknowledgement are set", () => {
    render(<AdminDeleteUserSection />);
    const deleteBtn = screen.getByRole("button", { name: /delete user/i });
    expect((deleteBtn as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/^user id$/i), { target: { value: "uuid-1" } });
    expect((deleteBtn as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("checkbox", { name: /acknowledge permanent deletion/i }));
    expect((deleteBtn as HTMLButtonElement).disabled).toBe(false);
  });

  it("calls deleteUserById and shows success", async () => {
    deleteUserById.mockResolvedValueOnce({ deleted_user_id: "uuid-1" });
    render(<AdminDeleteUserSection />);
    fireEvent.change(screen.getByLabelText(/^user id$/i), { target: { value: "uuid-1" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /acknowledge permanent deletion/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete user/i }));
    await waitFor(() => {
      expect(deleteUserById).toHaveBeenCalledWith("uuid-1");
    });
    expect(await screen.findByText(/deleted user uuid-1/i)).toBeTruthy();
  });

  it("surfaces API errors", async () => {
    deleteUserById.mockRejectedValueOnce(new Error("boom"));
    render(<AdminDeleteUserSection />);
    fireEvent.change(screen.getByLabelText(/^user id$/i), { target: { value: "uuid-1" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /acknowledge permanent deletion/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete user/i }));
    expect(await screen.findByText("boom")).toBeTruthy();
  });
});
