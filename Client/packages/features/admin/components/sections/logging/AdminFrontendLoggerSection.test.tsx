import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  API_SUBCATEGORY_CONFIG_KEYS,
  FRONTEND_LOGGER_BOOLEAN_KEYS,
} from "packages/logger/config/adminLoggerKeys.generated";
import type { components } from "packages/types/api.generated";

import { AdminFrontendLoggerSection } from "./AdminFrontendLoggerSection";

type ClientLoggerConfig = components["schemas"]["ClientLoggerConfig"];

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

vi.mock("packages/logger", () => ({
  log: {
    updateConfig: vi.fn(),
    security: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
  LOG_CATEGORIES: { SECURITY: "SECURITY", ERRORS: "ERRORS", API: "API" },
}));

function defaultClientConfig(): ClientLoggerConfig {
  const booleans = Object.fromEntries(
    FRONTEND_LOGGER_BOOLEAN_KEYS.map((key) => [key, true])
  ) as Record<string, boolean>;

  return {
    logLevel: "INFO",
    ...booleans,
    api: { initialLoad: true, polling: true, pageMount: true, other: true },
    errors: true,
    security: true,
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

describe("AdminFrontendLoggerSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each(FRONTEND_LOGGER_BOOLEAN_KEYS)("toggling %s calls mutation with client scope", (key) => {
    const mutation = createMutationMock();
    render(
      <AdminFrontendLoggerSection
        clientConfig={defaultClientConfig()}
        mutation={mutation as never}
      />
    );

    fireEvent.click(
      screen.getByRole("checkbox", { name: new RegExp(`Toggle ${String(key)}`, "i") })
    );
    expect(mutation.mutate).toHaveBeenCalledWith({
      client: expect.objectContaining({ [key]: false }),
    });
  });

  it.each(API_SUBCATEGORY_CONFIG_KEYS)(
    "toggling API %s calls mutation with nested api object",
    (subKey) => {
      const mutation = createMutationMock();
      render(
        <AdminFrontendLoggerSection
          clientConfig={defaultClientConfig()}
          mutation={mutation as never}
        />
      );

      fireEvent.click(
        screen.getByRole("checkbox", { name: new RegExp(`Toggle API ${subKey}`, "i") })
      );
      const call = mutation.mutate.mock.calls[0][0] as { client: { api: Record<string, boolean> } };
      expect(call.client.api[subKey]).toBe(false);
    }
  );
});
