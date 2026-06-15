import { useState } from "react";

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPatch = vi.fn();
let mockServerLayout: "grid" | "list" | undefined;
let mockClientSettingsLoading = false;

vi.mock("packages/hooks/data/user/useClientSettings", () => ({
  useClientSettings: () => ({
    clientSettings:
      mockServerLayout === "list" || mockServerLayout === "grid"
        ? { library: { documents: { layout: mockServerLayout, sort: "date_desc" } } }
        : null,
    clientSettingsQuery: { isLoading: mockClientSettingsLoading },
    patchClientSettings: mockPatch,
  }),
}));

vi.mock("packages/hooks/ui", () => ({
  useLocalStorage: (_key: string, defaultValue: string) => {
    const [value, setValue] = useState(defaultValue);
    return {
      value,
      setValue,
      removeValue: vi.fn(),
    };
  },
}));

import { useLibraryViewMode } from "./useLibraryViewMode";

describe("useLibraryViewMode", () => {
  beforeEach(() => {
    mockPatch.mockClear();
    mockServerLayout = "grid";
    mockClientSettingsLoading = false;
  });

  it("reflects local toggles immediately even when server layout is still stale", () => {
    mockServerLayout = "grid";

    const { result, rerender } = renderHook(() => useLibraryViewMode("documents"));

    expect(result.current.value).toBe("grid");

    act(() => {
      result.current.setMode("list");
    });
    rerender();

    expect(result.current.value).toBe("list");
    expect(mockPatch).toHaveBeenCalledWith({
      library: {
        documents: { layout: "list", sort: "date_desc" },
      },
    });
  });

  it("hydrates from server once when settings arrive", () => {
    mockServerLayout = undefined;
    mockClientSettingsLoading = true;

    const { result, rerender } = renderHook(() => useLibraryViewMode("documents"));
    expect(result.current.value).toBe("grid");

    mockServerLayout = "list";
    mockClientSettingsLoading = false;
    rerender();

    expect(result.current.value).toBe("list");
  });
});
