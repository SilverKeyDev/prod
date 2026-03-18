import { useEffect, useRef } from "react";

import { getEnv } from "packages/config";
import { isObject } from "packages/utils";

export function useWhyRender(props: Record<string, unknown>) {
  const prev = useRef<Record<string, unknown>>(props);
  useEffect(() => {
    if (!getEnv().isDevelopment) return;
    if (!isObject(prev.current) || !isObject(props)) return;

    const diffs: Record<string, [unknown, unknown]> = {};
    const keys = new Set([...Object.keys(prev.current), ...Object.keys(props)]);
    keys.forEach((k) => {
      if (prev.current[k] !== props[k]) {
        diffs[k] = [prev.current[k], props[k]];
      }
    });
    prev.current = props;
  });
}
