import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AgentConnectionStatusBadge } from "./AgentConnectionStatusBadge";

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({
    t: (key: string) =>
      ({
        "agent.connection_status.accepted": "Accepted",
        "agent.connection_status.waiting": "Waiting",
        "agent.connection_status.declined": "Declined",
      })[key] ?? key,
  }),
}));

describe("AgentConnectionStatusBadge", () => {
  it("renders nothing when status is none", () => {
    const { container } = render(<AgentConnectionStatusBadge status="none" />);
    expect(container.firstChild).toBeNull();
  });

  it.each([
    ["pending", "Waiting"],
    ["accepted", "Accepted"],
    ["declined", "Declined"],
  ] as const)("renders %s label for %s status", (status, label) => {
    render(<AgentConnectionStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeTruthy();
  });
});
