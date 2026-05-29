import "@testing-library/jest-dom/vitest";

import * as matchers from "jest-axe";
import { expect } from "vitest";

expect.extend(matchers.toHaveNoViolations);
