import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * Measures trigger and option label wrapping via hidden spans + ResizeObserver.
 * State updates force re-layout when wrap changes; consumers pass refs into trigger/menu markup.
 */
export function useDropdownWrapMeasurement(
  displayLabel: string,
  isOpen: boolean,
  filteredOptions: readonly unknown[],
): {
  measureRef: RefObject<HTMLSpanElement | null>;
  setOptionMeasureRef: (index: number) => (el: HTMLSpanElement | null) => void;
} {
  const [_labelWraps, setLabelWraps] = useState(false);
  const measureRef = useRef<HTMLSpanElement>(null);
  const optionMeasureRefs = useRef<Record<number, HTMLSpanElement | null>>({});
  const [_wrappingOptionIndices, setWrappingOptionIndices] = useState<
    Set<number>
  >(new Set());

  const checkLabelWrap = useCallback(() => {
    const measureEl = measureRef.current;
    if (!measureEl) return;
    const style = getComputedStyle(measureEl);
    const lineHeight = parseFloat(style.lineHeight);
    const singleLineHeight = Number.isFinite(lineHeight)
      ? lineHeight
      : parseFloat(style.fontSize) * 1.2;
    const wraps = measureEl.scrollHeight > singleLineHeight * 1.5;
    setLabelWraps(wraps);
  }, []);

  useEffect(() => {
    checkLabelWrap();
  }, [displayLabel, checkLabelWrap]);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const observer = new ResizeObserver(checkLabelWrap);
    observer.observe(el);
    return () => observer.disconnect();
  }, [checkLabelWrap]);

  const checkOptionWraps = useCallback(() => {
    const next = new Set<number>();
    Object.entries(optionMeasureRefs.current).forEach(([iStr, el]) => {
      if (!el) return;
      const index = Number(iStr);
      if (Number.isNaN(index)) return;
      const style = getComputedStyle(el);
      const lineHeight = parseFloat(style.lineHeight);
      const singleLineHeight = Number.isFinite(lineHeight)
        ? lineHeight
        : parseFloat(style.fontSize) * 1.2;
      if (el.scrollHeight > singleLineHeight * 1.5) next.add(index);
    });
    setWrappingOptionIndices(next);
  }, []);

  const setOptionMeasureRef = useCallback(
    (index: number) => (el: HTMLSpanElement | null) => {
      optionMeasureRefs.current[index] = el;
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) {
      setWrappingOptionIndices(new Set());
      return;
    }
    checkOptionWraps();
  }, [isOpen, checkOptionWraps, filteredOptions.length]);

  useEffect(() => {
    if (!isOpen) return;
    const refs = optionMeasureRefs.current;
    const observers: ResizeObserver[] = [];
    Object.keys(refs).forEach((iStr) => {
      const el = refs[Number(iStr)];
      if (!el) return;
      const observer = new ResizeObserver(checkOptionWraps);
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [isOpen, checkOptionWraps, filteredOptions]);

  return { measureRef, setOptionMeasureRef };
}
