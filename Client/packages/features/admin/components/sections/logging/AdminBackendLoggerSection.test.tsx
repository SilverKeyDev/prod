import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SERVER_CORE_LOGGER_BOOLEAN_KEYS,
  SERVER_EXTRA_LOGGER_BOOLEAN_KEYS,
} from "packages/logger/config/adminLoggerKeys.generated";
import type { components } from "packages/types/api.generated";

import { AdminBackendLoggerSection } from "./AdminBackendLoggerSection";

type ServerLoggerConfig = components["schemas"]["ServerLoggerConfig"];

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

function defaultServerConfig(): ServerLoggerConfig {
  const core = Object.fromEntries(
    SERVER_CORE_LOGGER_BOOLEAN_KEYS.map((key) => [key, true])
  ) as Pick<ServerLoggerConfig, (typeof SERVER_CORE_LOGGER_BOOLEAN_KEYS)[number]>;
  const extras = Object.fromEntries(
    SERVER_EXTRA_LOGGER_BOOLEAN_KEYS.map((key) => [key, false])
  ) as Pick<ServerLoggerConfig, (typeof SERVER_EXTRA_LOGGER_BOOLEAN_KEYS)[number]>;
  return {
    logLevel: "INFO",
    ...core,
    ...extras,
  };
}

function createMutationMock() {
  return {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  };
}

describe("AdminBackendLoggerSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards server category toggle to mutation", () => {
    const mutation = createMutationMock();
    render(
      <AdminBackendLoggerSection
        serverConfig={defaultServerConfig()}
        mutation={mutation as never}
      />
    );

    fireEvent.click(
      screen.getByRole("checkbox", { name: new RegExp(`Toggle server polling`, "i") })
    );
    expect(mutation.mutate).toHaveBeenCalledWith({ server: { polling: false } });
  });

  it("forwards log level change to mutation", () => {
    const mutation = createMutationMock();
    render(
      <AdminBackendLoggerSection
        serverConfig={defaultServerConfig()}
        mutation={mutation as never}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Log level, INFO/ }));
    fireEvent.click(screen.getByRole("option", { name: "WARN" }));
    expect(mutation.mutate).toHaveBeenCalledWith({ server: { logLevel: "WARN" } });
  });
});
