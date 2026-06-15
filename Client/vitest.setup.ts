import "@testing-library/jest-dom/vitest";

import * as matchers from "jest-axe";
import { expect, vi } from "vitest";

expect.extend(matchers.toHaveNoViolations);

// jsdom does not implement canvas; RippleBackground.web uses 2d context in tests.
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    setTransform: vi.fn(),
    scale: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  })) as typeof HTMLCanvasElement.prototype.getContext;
}
