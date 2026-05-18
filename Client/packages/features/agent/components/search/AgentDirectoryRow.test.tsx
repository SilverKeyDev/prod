import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AgentSearchResult } from "@/features/agent/api/agent";

import { AgentDirectoryRow } from "./AgentDirectoryRow";

vi.mock("./AgentConnectionStatusBadge", () => ({
  AgentConnectionStatusBadge: ({ status }: { status: string }) => (
    <span data-testid="connection-status-badge">{status}</span>
  ),
}));

vi.mock("@ui/icons", () => ({
  Icon: ({ name }: { name: string }) => <span data-testid={`icon-${name}`} />,
}));

vi.mock("packages/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("packages/ui")>();
  return {
    ...actual,
    Button: ({
      children,
      onClick,
      onPress,
      disabled,
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
      onPress?: () => void;
      disabled?: boolean;
    }) => (
      <button type="button" disabled={disabled} onClick={onClick ?? onPress}>
        {children}
      </button>
    ),
    Textarea: ({
      id,
      value,
      onChange,
      placeholder,
    }: {
      id?: string;
      value?: string;
      onChange?: (e: { target: { value: string } }) => void;
      placeholder?: string;
    }) => (
      <textarea
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange?.({ target: { value: e.target.value } })}
      />
    ),
  };
});

const agent: AgentSearchResult = {
  id: "agent-1",
  name: "Taylor Agent",
  email: "taylor@example.com",
  phone: "+15551234567",
};

const baseProps = {
  agent,
  isExpanded: false,
  onExpandConnect: vi.fn(),
  onCollapseConnect: vi.fn(),
  onOpenProfile: vi.fn(),
  profileButtonLabel: "View profile",
  connectButtonLabel: "Connect",
  message: "",
  onMessageChange: vi.fn(),
  onSendRequest: vi.fn(),
  isCreatingRequest: false,
  canSendRequest: true,
  sendButtonLabel: "Send request",
  cancelButtonLabel: "Cancel",
  messageFieldLabel: "Message (optional)",
  messagePlaceholder: "Add a note",
};

describe("AgentDirectoryRow", () => {
  it("shows View profile and Connect when status allows a new request", () => {
    render(<AgentDirectoryRow {...baseProps} connectionStatus="none" />);
    expect(screen.getByRole("button", { name: "View profile" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Connect" })).toBeTruthy();
  });

  it("hides Connect when waiting or accepted", () => {
    const { rerender } = render(<AgentDirectoryRow {...baseProps} connectionStatus="pending" />);
    expect(screen.queryByRole("button", { name: "Connect" })).toBeNull();
    expect(screen.getByTestId("connection-status-badge").textContent).toBe("pending");

    rerender(<AgentDirectoryRow {...baseProps} connectionStatus="accepted" />);
    expect(screen.queryByRole("button", { name: "Connect" })).toBeNull();
    expect(screen.getByTestId("connection-status-badge").textContent).toBe("accepted");
  });

  it("shows Connect again after declined", () => {
    render(<AgentDirectoryRow {...baseProps} connectionStatus="declined" />);
    expect(screen.getByRole("button", { name: "Connect" })).toBeTruthy();
    expect(screen.getByTestId("connection-status-badge").textContent).toBe("declined");
  });

  it("calls onOpenProfile when View profile is clicked", () => {
    const onOpenProfile = vi.fn();
    render(<AgentDirectoryRow {...baseProps} onOpenProfile={onOpenProfile} />);
    fireEvent.click(screen.getByRole("button", { name: "View profile" }));
    expect(onOpenProfile).toHaveBeenCalledTimes(1);
  });

  it("calls onExpandConnect when Connect is clicked", () => {
    const onExpandConnect = vi.fn();
    render(<AgentDirectoryRow {...baseProps} onExpandConnect={onExpandConnect} />);
    fireEvent.click(screen.getByRole("button", { name: "Connect" }));
    expect(onExpandConnect).toHaveBeenCalledTimes(1);
  });

  it("renders expanded connection form and sends request", () => {
    const onSendRequest = vi.fn();
    const onMessageChange = vi.fn();
    render(
      <AgentDirectoryRow
        {...baseProps}
        isExpanded
        message="Hello"
        onMessageChange={onMessageChange}
        onSendRequest={onSendRequest}
      />
    );
    expect(screen.getByLabelText("Message (optional)")).toHaveProperty("value", "Hello");
    fireEvent.click(screen.getByRole("button", { name: "Send request" }));
    expect(onSendRequest).toHaveBeenCalledTimes(1);
  });

  it("disables send when canSendRequest is false", () => {
    render(<AgentDirectoryRow {...baseProps} isExpanded canSendRequest={false} />);
    expect(
      (screen.getByRole("button", { name: "Send request" }) as HTMLButtonElement).disabled
    ).toBe(true);
  });
});
