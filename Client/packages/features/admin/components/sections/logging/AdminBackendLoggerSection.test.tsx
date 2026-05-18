import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { ServerLoggerConfig } from "packages/api/admin";

import { AdminBackendLoggerSection } from "./AdminBackendLoggerSection";

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
});

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({
    t: (key: string) => key,
  }),
}));

/** Mirrors CORE_BOOL_KEYS in AdminBackendLoggerSection — keep in sync. */
const CORE_BOOL_KEYS = [
  "polling",
  "pages",
  "hooks",
  "auth",
  "http",
  "api",
  "errors",
  "security",
] as const satisfies readonly (keyof ServerLoggerConfig)[];

/** Server-only keys in logger_config.py ALLOWED_LOGGER_CONFIG_KEYS (not in CORE_BOOL_KEYS). */
const SERVER_EXTRA_BOOL_KEYS = [
  "polygonSearch",
  "docusign",
  "documents",
  "profilePreferences",
] as const satisfies readonly (keyof ServerLoggerConfig)[];

const SERVER_LOG_LEVELS = ["DEBUG", "INFO", "WARN", "ERROR"] as const;

function defaultServerLoggerConfig(): ServerLoggerConfig {
  return {
    logLevel: "INFO",
    polling: true,
    pages: true,
    hooks: true,
    auth: true,
    http: true,
    api: true,
    errors: true,
    security: true,
  };
}

const be = vi.hoisted(() => {
  const state = {
    config: defaultServerLoggerConfig(),
    isLoading: false,
    error: null as Error | null,
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    mutationError: null as Error | null,
  };

  return {
    state,
    reset() {
      state.config = defaultServerLoggerConfig();
      state.isLoading = false;
      state.error = null;
      state.isPending = false;
      state.isError = false;
      state.mutationError = null;
      state.mutate.mockClear();
    },
  };
});

vi.mock("packages/hooks/data/admin/useAdminLoggerConfig", () => ({
  useAdminLoggerConfig: () => ({
    config: be.state.isLoading ? undefined : be.state.config,
    isLoading: be.state.isLoading,
    error: be.state.error,
    refetch: vi.fn(),
  }),
  useUpdateAdminLoggerConfig: () => ({
    mutate: be.state.mutate,
    isPending: be.state.isPending,
    isError: be.state.isError,
    error: be.state.mutationError,
  }),
}));

function openLogLevelDropdown(currentLevel: string): void {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`Log level, ${currentLevel}`) }));
}

function selectLogLevelOption(label: string): void {
  fireEvent.click(screen.getByRole("option", { name: label }));
}

describe("AdminBackendLoggerSection", () => {
  beforeEach(() => {
    be.reset();
  });

  it("shows loading copy while config is loading", () => {
    be.state.isLoading = true;
    render(<AdminBackendLoggerSection />);
    expect(screen.getByText("Loading server logger config…")).toBeTruthy();
  });

  it("shows error message when query error is an Error", () => {
    be.state.error = new Error("network down");
    render(<AdminBackendLoggerSection />);
    expect(screen.getByText("network down")).toBeTruthy();
  });

  it("shows generic failure when config is missing without an Error", () => {
    be.state.config = null as unknown as ServerLoggerConfig;
    render(<AdminBackendLoggerSection />);
    expect(screen.getByText("Failed to load server logger config")).toBeTruthy();
  });

  it("renders heading and forwards each core category toggle to mutate", () => {
    render(<AdminBackendLoggerSection />);
    expect(screen.getByRole("heading", { name: /Server logger/i })).toBeTruthy();

    for (const key of CORE_BOOL_KEYS) {
      be.state.mutate.mockClear();
      fireEvent.click(
        screen.getByRole("checkbox", { name: new RegExp(`Toggle server ${String(key)}`, "i") })
      );
      expect(be.state.mutate).toHaveBeenCalledTimes(1);
      expect(be.state.mutate).toHaveBeenCalledWith({
        [key]: false,
      } satisfies Partial<ServerLoggerConfig>);
    }
  });

  it.each(SERVER_LOG_LEVELS)("selecting log level %s calls mutate with logLevel", (level) => {
    render(<AdminBackendLoggerSection />);
    be.state.mutate.mockClear();
    openLogLevelDropdown("INFO");
    selectLogLevelOption(level);
    expect(be.state.mutate).toHaveBeenCalledWith({ logLevel: level });
  });

  it("renders server-only extra boolean keys from config", () => {
    be.state.config = {
      ...defaultServerLoggerConfig(),
      polygonSearch: false,
      docusign: true,
      documents: false,
      profilePreferences: true,
    };
    render(<AdminBackendLoggerSection />);

    for (const key of SERVER_EXTRA_BOOL_KEYS) {
      expect(
        screen.getByRole("checkbox", { name: new RegExp(`Toggle server ${String(key)}`, "i") })
      ).toBeTruthy();
    }
  });

  it.each(SERVER_EXTRA_BOOL_KEYS)("toggling server extra key %s calls mutate", (key) => {
    be.state.config = {
      ...defaultServerLoggerConfig(),
      polygonSearch: true,
      docusign: true,
      documents: true,
      profilePreferences: true,
      [key]: true,
    };
    render(<AdminBackendLoggerSection />);

    be.state.mutate.mockClear();
    fireEvent.click(
      screen.getByRole("checkbox", { name: new RegExp(`Toggle server ${String(key)}`, "i") })
    );
    expect(be.state.mutate).toHaveBeenCalledWith({
      [key]: false,
    } satisfies Partial<ServerLoggerConfig>);
  });

  it("disables category checkboxes and log level dropdown while mutation is pending", () => {
    be.state.isPending = true;
    render(<AdminBackendLoggerSection />);
    const polling = screen.getByRole("checkbox", { name: /Toggle server polling/i });
    expect((polling as HTMLInputElement).disabled).toBe(true);
    const levelTrigger = screen.getByRole("button", { name: /Log level, INFO/ });
    expect((levelTrigger as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows mutation error line when isError is true", () => {
    be.state.isError = true;
    be.state.mutationError = new Error("persist failed");
    render(<AdminBackendLoggerSection />);
    expect(screen.getByText("persist failed")).toBeTruthy();
  });

  it("shows generic update failed when isError without Error instance", () => {
    be.state.isError = true;
    be.state.mutationError = null;
    render(<AdminBackendLoggerSection />);
    expect(screen.getByText("Update failed")).toBeTruthy();
  });
});
