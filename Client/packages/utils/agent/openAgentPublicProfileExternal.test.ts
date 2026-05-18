import { beforeEach, describe, expect, it, vi } from "vitest";

const { openMock, linkingOpenURL } = vi.hoisted(() => ({
  openMock: vi.fn(),
  linkingOpenURL: vi.fn(),
}));

vi.mock("packages/utils/platform", () => ({
  getWindow: vi.fn(() => ({ open: openMock })),
}));

vi.mock("react-native", () => ({
  Linking: { openURL: linkingOpenURL },
}));

import { openAgentPublicProfileExternal } from "./openAgentPublicProfileExternal";

describe("openAgentPublicProfileExternal", () => {
  beforeEach(() => {
    openMock.mockClear();
    linkingOpenURL.mockClear();
  });

  it("opens profile URL in a new tab on web", () => {
    openAgentPublicProfileExternal({ id: "uuid-1", name: "Jane Agent" });
    expect(openMock).toHaveBeenCalledWith(
      "https://usesilverkey.com/agent-profile/jane-agent/uuid-1",
      "_blank",
      "noopener,noreferrer"
    );
    expect(linkingOpenURL).not.toHaveBeenCalled();
  });
});
