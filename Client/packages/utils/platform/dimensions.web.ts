/**
 * Web screen dimensions (viewport).
 */

import { getWindow } from "./adapter";

export type ScreenDimensions = {
  width: number;
  height: number;
};

export function getScreenDimensions(): ScreenDimensions {
  const w = getWindow();
  if (!w) {
    return { width: 0, height: 0 };
  }
  return {
    width: w.innerWidth,
    height: w.innerHeight,
  };
}
