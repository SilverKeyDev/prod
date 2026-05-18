import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdminSuperadminSections } from "./AdminSuperadminSections";

vi.mock("./AdminDeleteUserSection", () => ({
  AdminDeleteUserSection: () => <div data-testid="admin-delete-user" />,
}));

vi.mock("./AdminUserSystemRolesSection", () => ({
  AdminUserSystemRolesSection: () => <div data-testid="admin-user-roles" />,
}));

describe("AdminSuperadminSections", () => {
  it("composes gate roles and delete sections", () => {
    render(<AdminSuperadminSections />);
    expect(screen.getByTestId("admin-user-roles")).toBeTruthy();
    expect(screen.getByTestId("admin-delete-user")).toBeTruthy();
  });
});
