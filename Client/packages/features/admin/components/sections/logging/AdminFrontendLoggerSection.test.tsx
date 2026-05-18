import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { LoggerConfig } from "packages/logger";

import { AdminFrontendLoggerSection } from "./AdminFrontendLoggerSection";

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

/** Mirrors BOOLEAN_KEYS in AdminFrontendLoggerSection — keep in sync. */
const FRONTEND_BOOLEAN_KEYS = [
  "polling",
  "pages",
  "hooks",
  "auth",
  "http",
  "errors",
  "security",
] as const satisfies readonly (keyof LoggerConfig)[];

/** From default INFO — selecting INFO is a no-op until baseline differs; see dedicated test below. */
const LOG_LEVEL_CHANGES_FROM_INFO = ["DEBUG", "WARN", "ERROR"] as const;

const API_SUBKEYS = ["initialLoad", "polling", "pageMount", "other"] as const;

function defaultFrontendLoggerConfig(): LoggerConfig {
  return {
    logLevel: "INFO",
    polling: true,
    pages: true,
    hooks: true,
    auth: true,
    http: true,
    api: { initialLoad: true, polling: true, pageMount: true, other: true },
    errors: true,
    security: true,
  };
}

function cloneConfig(c: LoggerConfig): LoggerConfig {
  return JSON.parse(JSON.stringify(c)) as LoggerConfig;
}

function mergePartial(base: LoggerConfig, partial: Partial<LoggerConfig>): LoggerConfig {
  const next = { ...base, ...partial } as LoggerConfig;
  if (partial.api && typeof partial.api === "object" && typeof base.api === "object") {
    next.api = { ...(base.api as object), ...(partial.api as object) } as LoggerConfig["api"];
  }
  return next;
}

const fe = vi.hoisted(() => {
  const noop = vi.fn();
  const state = {
    config: defaultFrontendLoggerConfig(),
    throwOnGet: false,
    throwOnUpdate: false,
  };

  return {
    state,
    noop,
    reset() {
      state.config = defaultFrontendLoggerConfig();
      state.throwOnGet = false;
      state.throwOnUpdate = false;
      fe.updateConfig.mockClear();
      fe.security.mockClear();
      fe.error.mockClear();
      fe.noop.mockClear();
    },
    getConfig() {
      if (state.throwOnGet) throw new Error("get failed");
      return cloneConfig(state.config);
    },
    updateConfig: vi.fn((partial: Partial<LoggerConfig>) => {
      if (state.throwOnUpdate) throw new Error("update failed");
      state.config = mergePartial(state.config, partial);
    }),
    security: vi.fn(),
    error: vi.fn(),
  };
});

vi.mock("packages/logger", () => ({
  log: {
    getConfig: () => fe.getConfig(),
    updateConfig: (partial: Partial<LoggerConfig>) => fe.updateConfig(partial),
    security: (...args: Parameters<typeof fe.security>) => fe.security(...args),
    error: (...args: Parameters<typeof fe.error>) => fe.error(...args),
    warn: fe.noop,
    info: fe.noop,
    debug: fe.noop,
  },
  LOG_CATEGORIES: { SECURITY: "SECURITY", ERRORS: "ERRORS", API: "API" },
}));

function openLogLevelDropdown(currentLevel: string): void {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`Log level, ${currentLevel}`) }));
}

function selectLogLevelOption(label: string): void {
  fireEvent.click(screen.getByRole("option", { name: label }));
}

describe("AdminFrontendLoggerSection", () => {
  beforeEach(() => {
    fe.reset();
  });

  it("shows fallback when getConfig throws on mount", () => {
    fe.state.throwOnGet = true;
    render(<AdminFrontendLoggerSection />);
    expect(screen.getByText("Unable to read frontend logger config.")).toBeTruthy();
  });

  it("shows immediate-apply hint copy", () => {
    render(<AdminFrontendLoggerSection />);
    expect(
      screen.getByText("Checkbox and level changes apply immediately when toggled.")
    ).toBeTruthy();
  });

  it.each(FRONTEND_BOOLEAN_KEYS)("toggling %s calls updateConfig immediately", (key) => {
    render(<AdminFrontendLoggerSection />);
    fireEvent.click(
      screen.getByRole("checkbox", { name: new RegExp(`Toggle ${String(key)}`, "i") })
    );
    expect(fe.updateConfig).toHaveBeenCalledTimes(1);
    expect(fe.updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({ [key]: false } satisfies Partial<LoggerConfig>)
    );
    expect(fe.security).toHaveBeenCalled();
  });

  it.each(LOG_LEVEL_CHANGES_FROM_INFO)(
    "changing log level from INFO to %s calls updateConfig immediately",
    (level) => {
      render(<AdminFrontendLoggerSection />);
      openLogLevelDropdown("INFO");
      selectLogLevelOption(level);
      expect(fe.updateConfig).toHaveBeenCalledWith(
        expect.objectContaining({ logLevel: level } satisfies Partial<LoggerConfig>)
      );
    }
  );

  it("changing log level from DEBUG to INFO calls updateConfig immediately", () => {
    fe.state.config.logLevel = "DEBUG";
    render(<AdminFrontendLoggerSection />);
    openLogLevelDropdown("DEBUG");
    selectLogLevelOption("INFO");
    expect(fe.updateConfig).toHaveBeenCalledWith(
      expect.objectContaining({ logLevel: "INFO" } satisfies Partial<LoggerConfig>)
    );
  });

  it.each(API_SUBKEYS)("toggling API %s calls updateConfig with merged api object", (subKey) => {
    render(<AdminFrontendLoggerSection />);
    fireEvent.click(
      screen.getByRole("checkbox", { name: new RegExp(`Toggle API ${subKey}`, "i") })
    );
    expect(fe.updateConfig).toHaveBeenCalledTimes(1);
    const call = fe.updateConfig.mock.calls[0][0] as Partial<LoggerConfig>;
    expect(call.api).toBeTruthy();
    expect(typeof call.api).toBe("object");
    expect((call.api as Record<string, boolean>)[subKey]).toBe(false);
  });

  it("calls log.error when updateConfig throws on toggle", () => {
    fe.state.throwOnUpdate = true;
    render(<AdminFrontendLoggerSection />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Toggle polling/i }));
    expect(fe.error).toHaveBeenCalled();
    expect(fe.security).not.toHaveBeenCalled();
  });
});
