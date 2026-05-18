import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminPlaceholderSection } from "./AdminPlaceholderSection";

describe("AdminPlaceholderSection", () => {
  it("renders title, description, and placeholder body", () => {
    render(
      <AdminPlaceholderSection title="Alpha" description="Beta description for admin tools." />
    );
    expect(screen.getByRole("heading", { name: "Alpha" })).toBeTruthy();
    expect(screen.getByText("Beta description for admin tools.")).toBeTruthy();
    expect(screen.getByText("No tools connected here yet.")).toBeTruthy();
  });
});
