import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { API_SUBCATEGORY_CONFIG_KEYS } from "packages/logger/config/adminLoggerKeys.generated";
import {
  ADMIN_LOGGER_UI_GROUPS,
  LOGGER_CONFIG_KEY_TO_LOG_PATH,
} from "packages/logger/config/adminLoggerUiMeta.generated";
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
  const togglableKeys = [
    ...ADMIN_LOGGER_UI_GROUPS.core.keys,
    ...ADMIN_LOGGER_UI_GROUPS.features.keys,
    ...ADMIN_LOGGER_UI_GROUPS.alwaysEnabled.keys,
  ];
  const booleans = Object.fromEntries(togglableKeys.map((key) => [key, true])) as Record<
    string,
    boolean
  >;

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

  const togglableKeys = [
    ...ADMIN_LOGGER_UI_GROUPS.core.keys,
    ...ADMIN_LOGGER_UI_GROUPS.features.keys,
  ];

  it.each(
    ADMIN_LOGGER_UI_GROUPS.alwaysEnabled.keys.map(
      (key) => [key, LOGGER_CONFIG_KEY_TO_LOG_PATH[key] ?? key] as const
    )
  )("always-on %s stays checked and does not mutate when clicked", (key, label) => {
    const mutation = createMutationMock();
    const config = { ...defaultClientConfig(), [key]: false };
    render(<AdminFrontendLoggerSection clientConfig={config} mutation={mutation as never} />);

    const checkbox = screen.getByRole("checkbox", { name: `Toggle ${label}` });
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(mutation.mutate).not.toHaveBeenCalled();
  });

  it.each(togglableKeys)("toggling %s calls mutation with client scope", (key) => {
    const mutation = createMutationMock();
    render(
      <AdminFrontendLoggerSection
        clientConfig={defaultClientConfig()}
        mutation={mutation as never}
      />
    );

    const label = LOGGER_CONFIG_KEY_TO_LOG_PATH[key] ?? key;
    fireEvent.click(screen.getByRole("checkbox", { name: `Toggle ${label}` }));
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

      fireEvent.click(screen.getByRole("checkbox", { name: `Toggle API ${subKey}` }));
      const call = mutation.mutate.mock.calls[0][0] as { client: { api: Record<string, boolean> } };
      expect(call.client.api[subKey]).toBe(false);
    }
  );
});
