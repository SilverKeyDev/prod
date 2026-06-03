import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import Input from "packages/ui/components/form/inputs/Input.web";
import BaseModal from "packages/ui/components/modals/BaseModal.web";
import { UnderlineTabs } from "packages/ui/components/tabs/UnderlineTabs";

vi.mock("packages/contexts", () => ({
  useLocalization: () => ({ t: (key: string) => key }),
}));

describe("accessibility (jest-axe)", () => {
  it("Input with label has no serious axe violations", async () => {
    const { container } = render(
      <Input label="Email address" id="email" placeholder="you@example.com" />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("UnderlineTabs has no serious axe violations", async () => {
    const { container } = render(
      <UnderlineTabs
        items={[
          { id: "a", label: "Tab A" },
          { id: "b", label: "Tab B" },
        ]}
        activeId="a"
        onChange={() => {}}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("BaseModal dialog has no serious axe violations", async () => {
    const { container } = render(
      <BaseModal isOpen onClose={() => {}} title="Example modal">
        <p>Modal body content</p>
      </BaseModal>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
