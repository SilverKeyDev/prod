import { useRef, useEffect } from "react";

export function useWhyRender(name: string, props: any) {
  const prev = useRef(props);
  useEffect(() => {
    const diffs: Record<string, [any, any]> = {};
    const keys = new Set([...Object.keys(prev.current), ...Object.keys(props)]);
    keys.forEach(k => {
      if (prev.current[k] !== props[k]) {
        diffs[k] = [prev.current[k], props[k]];
      }
    });
    if (Object.keys(diffs).length) {
      // eslint-disable-next-line no-console
      console.log(`[WHY] ${name} changed`, diffs);
    }
    prev.current = props;
  });
}
